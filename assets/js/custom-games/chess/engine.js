const ENGINE_LEVELS = {
  easy: { skill: 0, depth: 2, movetime: 160 },
  medium: { skill: 8, depth: 6, movetime: 480 },
  hard: { skill: 20, depth: 14, movetime: 1500 },
};

export class ChessEngine {
  constructor({ onStatus = () => {}, onInfo = () => {} } = {}) {
    this.onStatus = onStatus;
    this.onInfo = onInfo;
    this.worker = null;
    this.ready = false;
    this.initPromise = null;
    this.pending = null;
    this.buffer = "";
    this.usingAsm = false;
    this.disposed = false;
  }

  async ensure() {
    if (this.disposed) throw new Error("Engine disposed.");
    if (this.ready) return this;
    if (!this.initPromise) {
      this.initPromise = this.boot().catch((error) => {
        this.initPromise = null;
        throw error;
      });
    }
    return this.initPromise;
  }

  async boot() {
    this.onStatus("loading", "Preparing Stockfish");
    try {
      await this.startWorker("wasm");
      this.onStatus("ready", "Stockfish ready");
      return this;
    } catch (error) {
      if (this.disposed) throw error;
      console.warn("Stockfish WASM unavailable; trying asm.js.", error);
      try {
        await this.startWorker("asm");
        this.onStatus("ready", "Stockfish ready (asm.js)");
        return this;
      } catch (fallbackError) {
        this.ready = false;
        this.onStatus("error", "Chess engine unavailable");
        throw fallbackError;
      }
    }
  }

  startWorker(mode) {
    return new Promise((resolve, reject) => {
      this.usingAsm = mode === "asm";
      const path = this.usingAsm
        ? "/assets/vendor/stockfish/stockfish.js"
        : "/assets/vendor/stockfish/stockfish.wasm.js";
      let worker;
      try {
        worker = new Worker(path);
      } catch (error) {
        reject(error);
        return;
      }
      this.worker = worker;
      this.buffer = "";
      let settled = false;
      let readyTimer = 0;
      const cleanup = () => {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
      };
      const fail = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(readyTimer);
        cleanup();
        try {
          worker.terminate();
        } catch {
          // Already gone.
        }
        if (this.worker === worker) this.worker = null;
        reject(error);
      };
      const succeed = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(readyTimer);
        this.ready = true;
        this.setupMessages(worker);
        resolve(this);
      };

      worker.onerror = (event) => {
        fail(new Error(event.message || "Stockfish worker failed."));
      };
      worker.onmessageerror = () => fail(new Error("Stockfish message error."));
      worker.onmessage = (event) => {
        const text = String(event.data || "");
        this.buffer += `${text}\n`;
        if (text.includes("uciok")) {
          worker.postMessage("isready");
        }
        if (text.includes("readyok")) succeed();
      };

      readyTimer = window.setTimeout(() => {
        fail(new Error("Stockfish startup timed out."));
      }, this.usingAsm ? 18000 : 5000);
      worker.postMessage("uci");
    });
  }

  setupMessages(worker) {
    worker.onmessage = (event) => {
      const lines = String(event.data || "").split(/\r?\n/);
      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith("info ")) {
          const depthMatch = line.match(/\bdepth\s+(\d+)/);
          const scoreMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
          const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
          if (depthMatch) {
            this.onInfo({
              depth: Number(depthMatch[1]),
              score: mateMatch ? `M${mateMatch[1]}` : scoreMatch ? Number(scoreMatch[1]) / 100 : null,
            });
          }
        }
        if (line.startsWith("bestmove")) {
          const match = line.match(/\bbestmove\s+(\S+)/);
          const pending = this.pending;
          this.pending = null;
          this.onStatus("ready", "Stockfish ready");
          if (pending) {
            window.clearTimeout(pending.timer);
            if (match) pending.resolve(match[1]);
            else pending.reject(new Error("Stockfish returned no move."));
          }
        }
      }
    };
  }

  newGame() {
    if (!this.ready || !this.worker) return;
    this.worker.postMessage("ucinewgame");
    this.worker.postMessage("isready");
  }

  async bestMove(fen, difficulty = "medium") {
    if (this.disposed) throw new Error("Engine disposed.");
    await this.ensure();
    if (!this.worker) throw new Error("Engine worker missing.");
    if (this.pending) {
      this.worker.postMessage("stop");
      this.pending.reject(new Error("Search interrupted."));
      this.pending = null;
    }
    const level = ENGINE_LEVELS[difficulty] || ENGINE_LEVELS.medium;
    this.worker.postMessage(`setoption name Skill Level value ${level.skill}`);
    this.worker.postMessage(`position fen ${fen}`);
    this.onStatus("thinking", "Rival is calculating");
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (this.pending?.reject === reject) {
          this.pending = null;
          this.worker?.postMessage("stop");
          reject(new Error("Stockfish search timed out."));
        }
      }, level.movetime + 6500);
      this.pending = { resolve, reject, timer };
      this.worker.postMessage(`go depth ${level.depth} movetime ${level.movetime}`);
    });
  }

  stop() {
    if (this.pending) {
      window.clearTimeout(this.pending.timer);
      this.pending.reject(new Error("Search cancelled."));
      this.pending = null;
    }
    this.worker?.postMessage("stop");
  }

  destroy() {
    this.disposed = true;
    this.stop();
    if (this.worker) {
      try {
        this.worker.postMessage("quit");
      } catch {
        // Already gone.
      }
      try {
        this.worker.terminate();
      } catch {
        // Already gone.
      }
    }
    this.worker = null;
    this.ready = false;
  }
}

export { ENGINE_LEVELS };
