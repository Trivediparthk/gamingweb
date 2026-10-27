export const CATEGORIES = [
  {
    slug: "action",
    name: "Action",
    icon: "action",
    tagline: "Fast hands, clean escapes.",
    description:
      "Kinetic games built around quick decisions, close calls and the urge to try once more. Our action shelf favours readable rules over spectacle.",
  },
  {
    slug: "adventure",
    name: "Adventure",
    icon: "adventure",
    tagline: "A small world with a way out.",
    description:
      "Compact journeys built around exploration, route-finding and a satisfying sense of progress. No sprawling maps, just a world worth reading.",
  },
  {
    slug: "arcade",
    name: "Arcade",
    icon: "arcade",
    tagline: "One more run.",
    description:
      "Immediate, score-driven games shaped for short sessions. Arcade is where Robloxsplay puts its sharpest loops and most replayable ideas.",
  },
  {
    slug: "3d",
    name: "3D",
    icon: "3d",
    tagline: "Depth, not decoration.",
    description:
      "Games built around real-time 3D worlds, readable depth and spatial play. Use the third dimension to read a lane, aim a shot or find the next route.",
  },
  {
    slug: "racing",
    name: "Racing",
    icon: "racing",
    tagline: "Hold the line.",
    description:
      "Speed, lines and clean exits. Our racing shelf is built around readable traffic, original handling and runs that reward a better line.",
  },
  {
    slug: "driving",
    name: "Driving",
    icon: "racing",
    tagline: "Find the grip.",
    description:
      "Driving games about handling, balance and the next piece of difficult terrain. Keep the car planted and the line clean.",
  },
  {
    slug: "off-road",
    name: "Off-Road",
    icon: "racing",
    tagline: "Take the rough line.",
    description:
      "Mud, rock and steep terrain. Off-road challenges about grip, momentum and making a vehicle survive the route.",
  },
  {
    slug: "runner",
    name: "Runner",
    icon: "runner",
    tagline: "Find the open lane.",
    description:
      "Endless runs built around lane reading, timing and the clean restart. Every route is generated from original code and art, with no borrowed courses.",
  },
  {
    slug: "puzzle",
    name: "Puzzle",
    icon: "puzzle",
    tagline: "The good kind of stuck.",
    description:
      "Logic-first games with clear rules and room to think. Every puzzle here can be understood in a minute and revisited without a walkthrough.",
  },
  {
    slug: "sports",
    name: "Sports",
    icon: "sports",
    tagline: "Pure competitive shape.",
    description:
      "Browser-sized sports ideas stripped back to timing, angles and nerve. Easy to start, difficult to put down.",
  },
  {
    slug: "football",
    name: "Football",
    icon: "sports",
    tagline: "Read the set piece.",
    description:
      "Football games about timing, power and the small decisions around the ball. Take the kick, bend the shot and read the keeper.",
  },
  {
    slug: "soccer",
    name: "Soccer",
    icon: "sports",
    tagline: "One clean strike.",
    description:
      "Soccer challenges built around accuracy, power and the satisfying arc of a well-aimed shot.",
  },
  {
    slug: "cricket",
    name: "Cricket",
    icon: "sports",
    tagline: "Time the innings.",
    description:
      "Cricket games about batting, bowling, fielding and the momentum swings inside a close match.",
  },
  {
    slug: "casual",
    name: "Casual",
    icon: "casual",
    tagline: "A clean little reset.",
    description:
      "Low-friction games for a spare minute. Gentle to learn, still worth caring about, and comfortable with keyboard or thumb.",
  },
  {
    slug: "strategy",
    name: "Strategy",
    icon: "strategy",
    tagline: "Think a turn ahead.",
    description:
      "Puzzles and systems that reward planning over button speed. Small boards, meaningful choices and no hidden rules.",
  },
  {
    slug: "shooting",
    name: "Shooting",
    icon: "shooting",
    tagline: "Keep your focus.",
    description:
      "Aim-and-survive challenges with direct controls and readable threats. Our shooting shelf is about concentration rather than excess.",
  },
  {
    slug: "multiplayer",
    name: "Multiplayer",
    icon: "multiplayer",
    tagline: "Better with a rival.",
    description:
      "Reserved for games that genuinely support live or local multiplayer. Nothing is listed here until that feature has been tested and confirmed.",
  },
  {
    slug: "girls",
    name: "Girls & Dress-up",
    icon: "girls",
    tagline: "Style without limits.",
    description:
      "Creative, character-led games with thoughtful presentation. This shelf stays empty until a suitable original or licensed title is ready.",
  },
  {
    slug: "kids",
    name: "Kids & Family",
    icon: "kids",
    tagline: "Easy to share.",
    description:
      "Approachable games with gentle difficulty and clear feedback. Intended for family play, with no accounts, chat or in-app purchases.",
  },
  {
    slug: "educational",
    name: "Educational",
    icon: "kids",
    tagline: "Play with a purpose.",
    description:
      "Creative, curiosity-led games that make a little room for learning. Explore, experiment and tell a story without a worksheet in sight.",
  },
  {
    slug: "board",
    name: "Board",
    icon: "board",
    tagline: "Old rules, new table.",
    description:
      "Digital takes on tabletop thinking: turns, grids and quiet competition. Only games with complete, verified rules are published here.",
  },
  {
    slug: "skill",
    name: "Skill",
    icon: "skill",
    tagline: "Sharpen the reflex.",
    description:
      "Accuracy, timing and control. These games are built to show you exactly where you can improve, one attempt at a time.",
  },
  {
    slug: "cooking",
    name: "Cooking",
    icon: "simulation",
    tagline: "Keep the pass moving.",
    description:
      "Bright, busy kitchen games about timing, orders and the small decisions that keep a restaurant running. Read the queue, plan the stations and serve before the pass backs up.",
  },
  {
    slug: "simulation",
    name: "Simulation",
    icon: "simulation",
    tagline: "Small systems, real choices.",
    description:
      "Focused simulations about running a kitchen or handling a vehicle, without a steep learning wall. Read the system, make a plan and improve the next run.",
  },
  {
    slug: "classic",
    name: "Classic",
    icon: "classic",
    tagline: "Familiar, not predictable.",
    description:
      "New interpretations of game ideas that have earned their place. Respectful of the original rules, rebuilt with original code and art.",
  },
];

export const GAMES = [
  {
    id: "nx-001",
    slug: "neon-snake",
    title: "Neon Snake",
    tagline: "Leave a little light behind.",
    description:
      "A luminous take on a grid classic. Thread a growing light-trail through the dark, collect energy nodes and keep your line out of its own way. The pace climbs with every pickup.",
    category: "Arcade",
    categories: ["Arcade", "Classic", "Kids"],
    thumbnail: "/assets/images/games/neon-snake.svg",
    thumbnailAlt: "Abstract neon key art showing a coiled lime light trail on a dark grid.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Steer with the arrow keys, WASD, a swipe or the on-screen pad. Collect the glowing nodes and avoid the walls and your own trail. Each node makes the trail longer and the game slightly faster.",
    controls: [
      { label: "Steer", value: "Arrow keys / WASD / swipe" },
      { label: "Pause", value: "P or the pause button" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: true,
    featuredRank: 1,
    curated: true,
    status: "ready",
    module: "neon-snake",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "lime",
    releaseDate: "2026-10-22",
    playtime: "2–5 min",
    difficulty: "Pick up and play",
    aspect: "16 / 10",
  },
  {
    id: "nx-002",
    slug: "orbit-pong",
    title: "Orbit Pong",
    tagline: "Zero gravity. Real depth.",
    description:
      "A 3D zero-gravity pong duel in a neon orbital court. Move your paddle across the plane, add spin off the edges and outlast a focused rival in a first-to-seven match.",
    category: "Sports",
    categories: ["Sports", "Arcade", "Classic"],
    scoreLabel: "You",
    bestLabel: "Match wins",
    thumbnail: "/assets/images/games/orbit-pong-3d.png",
    thumbnailAlt: "3D orbital pong court with a glowing cyan ball and two neon paddles.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Move your paddle across the court with the mouse, touch, WASD or the arrow keys. Deflect the ball, use the paddle edges to add spin and beat the rival to seven points. The AI tracks the ball, so vary your angles and speed.",
    controls: [
      { label: "Paddle", value: "Mouse / touch / WASD / Arrows" },
      { label: "Pause", value: "P or the pause button" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: true,
    featuredRank: 2,
    curated: true,
    status: "ready",
    module: "orbit-pong",
    renderer: "3d",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "cyan",
    releaseDate: "2026-10-21",
    playtime: "2–4 min",
    difficulty: "Easy to learn",
    aspect: "16 / 10",
  },
  {
    id: "nx-003",
    slug: "prism-breaker",
    title: "Prism Breaker",
    tagline: "Break the wall in three dimensions.",
    description:
      "A full 3D prism arena. The core travels through depth toward a wall of 45 prisms while you slide a neon energy barrier across the near plane. Clear the wall with three lives.",
    category: "Action",
    categories: ["Action", "Arcade"],
    thumbnail: "/assets/images/games/prism-breaker-3d.png",
    thumbnailAlt: "3D prism wall arena with a glowing core, energy barrier and neon blocks.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Move the energy barrier with the mouse, touch, A/D or the arrow keys. Click, tap or press Space to launch the core. Break all 45 prisms without losing three cores. The barrier spans the height of the arena, so line up in X and keep the core in play.",
    controls: [
      { label: "Barrier", value: "Mouse / touch / A-D / Arrows" },
      { label: "Launch", value: "Click / tap / Space" },
      { label: "Pause", value: "P or the pause button" },
    ],
    featured: false,
    featuredRank: 4,
    curated: true,
    status: "ready",
    module: "prism-breaker",
    renderer: "3d",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "violet",
    releaseDate: "2026-10-20",
    playtime: "3–6 min",
    difficulty: "Medium",
    aspect: "16 / 10",
  },
  {
    id: "nx-004",
    slug: "memory-matrix",
    title: "Memory Matrix",
    tagline: "Patterns hide in plain sight.",
    description:
      "A calm-but-sharp memory test. Flip pairs of geometric signals, remember their positions and clear the 4×4 matrix in as few moves as possible.",
    category: "Puzzle",
    categories: ["Puzzle", "Casual", "Kids"],
    bestMode: "lower",
    scoreLabel: "Moves",
    bestLabel: "Best moves",
    thumbnail: "/assets/images/games/memory-matrix.svg",
    thumbnailAlt: "A grid of glowing geometric cards in violet and cyan on a navy field.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Reveal two cards at a time by clicking or tapping them. Matching symbols stay open. Clear all eight pairs to finish. Use the arrow keys and Enter or Space for a keyboard-only game.",
    controls: [
      { label: "Select", value: "Mouse / touch / Arrow keys" },
      { label: "Reveal", value: "Click, tap, Enter or Space" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: false,
    featuredRank: 7,
    curated: false,
    status: "ready",
    module: "memory-matrix",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "violet",
    releaseDate: "2026-10-19",
    playtime: "2–4 min",
    difficulty: "Easy",
    aspect: "16 / 10",
  },
  {
    id: "nx-005",
    slug: "number-merge",
    title: "Number Merge",
    tagline: "Two moves ahead.",
    description:
      "Slide numbered tiles across a compact grid, merge matching values and build a single tile worth 2048. Every move changes the board, so make each one count.",
    category: "Puzzle",
    categories: ["Puzzle", "Strategy"],
    thumbnail: "/assets/images/games/number-merge.svg",
    thumbnailAlt: "A dark four-by-four tile board with glowing numerals and lime highlights.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Swipe or use the arrow keys to slide every tile in one direction. Equal tiles merge into their sum and a new tile appears after each valid move. Reach 2048 to win; keep playing for a higher score if you like.",
    controls: [
      { label: "Slide", value: "Arrow keys / WASD / swipe" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: false,
    featuredRank: 8,
    curated: true,
    status: "ready",
    module: "number-merge",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "lime",
    releaseDate: "2026-10-18",
    playtime: "5–12 min",
    difficulty: "Medium",
    aspect: "16 / 10",
  },
  {
    id: "nx-006",
    slug: "meteor-defender",
    title: "Meteor Defender",
    tagline: "Thread the field in three dimensions.",
    description:
      "A real 3D asteroid field. Fly a survey ship through rocks that grow as they approach, collect energy shards and survive as the spawn rate and speed climb.",
    category: "Shooting",
    categories: ["Shooting", "Action"],
    thumbnail: "/assets/images/games/meteor-defender-3d.png",
    thumbnailAlt: "3D asteroid field with a cyan survey ship, glowing meteors and energy shards.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Move the ship with the mouse, touch, WASD or the arrow keys. Dodge the meteors as they come toward the camera, collect lime energy shards and stay alive. One impact ends the run; passing rocks adds a small bonus.",
    controls: [
      { label: "Ship", value: "Mouse / touch / WASD / Arrows" },
      { label: "Pause", value: "P or the pause button" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: false,
    featuredRank: 6,
    curated: true,
    status: "ready",
    module: "meteor-defender",
    renderer: "3d",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "coral",
    releaseDate: "2026-10-17",
    playtime: "1–3 min",
    difficulty: "Reflex",
    aspect: "16 / 10",
  },
  {
    id: "nx-007",
    slug: "reaction-rush",
    title: "Reaction Rush",
    tagline: "Do nothing, then everything.",
    description:
      "A precision reaction trial. Wait for the signal, strike the instant it changes and keep five rounds under pressure without firing early.",
    category: "Skill",
    categories: ["Skill", "Casual"],
    bestMode: "lower",
    scoreLabel: "Avg ms",
    bestLabel: "Best avg ms",
    thumbnail: "/assets/images/games/reaction-rush.svg",
    thumbnailAlt: "Concentric reaction rings in violet and acid green against a midnight background.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Press Space, click or tap as soon as the target turns lime. Do not react during the waiting phase or the round is treated as a false start. Complete five rounds and your average reaction time becomes your score.",
    controls: [
      { label: "React", value: "Space / click / tap" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: false,
    featuredRank: 9,
    curated: false,
    status: "ready",
    module: "reaction-rush",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "violet",
    releaseDate: "2026-10-16",
    playtime: "Under 2 min",
    difficulty: "Timing",
    aspect: "16 / 10",
  },
  {
    id: "nx-008",
    slug: "grid-runner",
    title: "Grid Runner",
    tagline: "A maze with real walls and real depth.",
    description:
      "A turn-based 3D maze. Step through a neon grid, collect all six shards, read the patrol drones between moves and reach the unlocked exit.",
    category: "Adventure",
    categories: ["Adventure", "Strategy"],
    thumbnail: "/assets/images/games/grid-runner-3d.png",
    thumbnailAlt: "3D neon maze with a glowing runner, patrol drones, shards and a portal exit.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Move one cell at a time with the arrow keys, WASD, a swipe or the on-screen pad. Collect all six shards to unlock the exit, avoid the patrol drones and reach the portal. Each of your moves also advances the drones.",
    controls: [
      { label: "Move", value: "Arrows / WASD / swipe / pad" },
      { label: "Pause", value: "P or the pause button" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: true,
    featuredRank: 3,
    curated: true,
    status: "ready",
    module: "grid-runner",
    renderer: "3d",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "cyan",
    releaseDate: "2026-10-15",
    playtime: "2–5 min",
    difficulty: "Think + react",
    aspect: "16 / 10",
  },
  {
    id: "nx-009",
    slug: "target-tap",
    title: "Target Tap",
    tagline: "A shooting gallery with real depth.",
    description:
      "A 3D target range. Aim into the depth of the arena, hit glossy targets with a real raycast shot and chain combos across thirty seconds.",
    category: "Casual",
    categories: ["Casual", "Skill", "Kids"],
    thumbnail: "/assets/images/games/target-tap-3d.png",
    thumbnailAlt: "3D shooting range with glossy targets, depth lighting and a neon score wall.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Aim with the mouse, touch or the arrow keys and shoot with a click, tap or Space. Targets sit at different depths; raycast hits score 10 plus a combo bonus. A miss or an expired target resets the combo. Thirty-second round.",
    controls: [
      { label: "Aim", value: "Mouse / touch / Arrows" },
      { label: "Shoot", value: "Click / tap / Space" },
      { label: "Pause", value: "P or the pause button" },
    ],
    featured: false,
    featuredRank: 10,
    curated: false,
    status: "ready",
    module: "target-tap",
    renderer: "3d",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "lime",
    releaseDate: "2026-10-14",
    playtime: "30 sec",
    difficulty: "Easy",
    aspect: "16 / 10",
  },
  {
    id: "nx-010",
    slug: "logic-tiles",
    title: "Logic Tiles",
    tagline: "Turn every light off.",
    description:
      "A deceptively simple light puzzle. Each tap inverts a tile and its neighbours. Switch every light off to open the next, larger grid.",
    category: "Strategy",
    categories: ["Strategy", "Puzzle"],
    bestMode: "lower",
    scoreLabel: "Moves",
    bestLabel: "Best moves",
    thumbnail: "/assets/images/games/logic-tiles.svg",
    thumbnailAlt: "A grid of violet and lime light tiles with cross-shaped toggle marks.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Select a tile to toggle it and the tiles directly above, below, left and right. Turn every light off to complete the round. Each cleared board opens a larger grid. Use the arrow keys and Enter or Space for keyboard play.",
    controls: [
      { label: "Select", value: "Mouse / touch / Arrow keys" },
      { label: "Toggle", value: "Click, tap, Enter or Space" },
      { label: "Restart", value: "R or the restart button" },
    ],
    featured: false,
    featuredRank: 5,
    curated: true,
    status: "ready",
    module: "logic-tiles",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "violet",
    releaseDate: "2026-10-13",
    playtime: "3-8 min",
    difficulty: "Logic",
    aspect: "16 / 10",
  },
  {
    id: "nx-011",
    slug: "jungle-dash",
    title: "Jungle Dash",
    tagline: "Outrun the closing canopy.",
    description:
      "A three-lane sprint along a forgotten jungle trail. Read fallen logs and hanging branches early, switch lanes for sun-seed pickups and keep the route clean as the pace climbs.",
    category: "Runner",
    categories: ["Runner", "Adventure", "Kids"],
    thumbnail: "/assets/images/games/jungle-dash.svg",
    thumbnailAlt:
      "Original jungle trail key art with a lime-lit runner, hanging vines and a fallen log.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Switch lanes with the left and right arrows, A and D, a swipe or the on-screen pad. Jump low logs with Up, W or Space. Slide under high branches with Down or S. Collect sun seeds for bonus score. One missed obstacle ends the run.",
    controls: [
      { label: "Switch lane", value: "Left + Right / A + D / swipe" },
      { label: "Jump", value: "Up / W / Space" },
      { label: "Slide", value: "Down / S / swipe down" },
      { label: "Pause", value: "P or the pause button" },
    ],
    featured: false,
    featuredRank: 11,
    curated: true,
    status: "ready",
    module: "jungle-dash",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "lime",
    releaseDate: "2026-10-24",
    playtime: "1-3 min",
    difficulty: "Jump + slide",
    aspect: "16 / 10",
  },
  {
    id: "nx-012",
    slug: "metro-sprint",
    title: "Metro Sprint",
    tagline: "Catch the last line out.",
    description:
      "A midnight platform run through an original neon transit network. Hop service barriers, slide beneath low route boards and thread the open lane as the last train pulls away.",
    category: "Runner",
    categories: ["Runner", "Arcade", "Action"],
    thumbnail: "/assets/images/games/metro-sprint.svg",
    thumbnailAlt:
      "Original midnight metro platform key art with cyan rails, rain and a courier runner.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Switch lanes with the left and right arrows, A and D, a swipe or the on-screen pad. Jump low barriers with Up, W or Space. Slide under low signs with Down or S. Transit tokens add to your score. One collision ends the run.",
    controls: [
      { label: "Switch lane", value: "Left + Right / A + D / swipe" },
      { label: "Jump", value: "Up / W / Space" },
      { label: "Slide", value: "Down / S / swipe down" },
      { label: "Pause", value: "P or the pause button" },
    ],
    featured: false,
    featuredRank: 12,
    curated: true,
    status: "ready",
    module: "metro-sprint",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "cyan",
    releaseDate: "2026-10-24",
    playtime: "1-3 min",
    difficulty: "Reflex",
    aspect: "16 / 10",
  },
  {
    id: "nx-013",
    slug: "neon-street-racer",
    title: "Neon Street Racer",
    tagline: "Thread the midnight traffic.",
    description:
      "An original arcade street race through a rain-slick neon city. Steer freely, time a boost and brake before the traffic closes, then take every clean gap for a bigger overtake score.",
    category: "Racing",
    categories: ["Racing", "Arcade", "Skill"],
    thumbnail: "/assets/images/games/neon-street-racer.svg",
    thumbnailAlt:
      "Original neon street racing key art with a rear-view sports car, city lights and traffic.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Steer freely with the left and right arrows, A and D, a swipe or by dragging across the track. Tap Up or W for a short boost, and Down or S to brake. Avoid every traffic car. Overtakes and distance build your score; the pace rises the longer you survive.",
    controls: [
      { label: "Steer", value: "Left + Right / A + D / drag" },
      { label: "Boost", value: "Up / W" },
      { label: "Brake", value: "Down / S" },
      { label: "Pause", value: "P or the pause button" },
    ],
    featured: false,
    featuredRank: 13,
    curated: true,
    status: "ready",
    module: "neon-street-racer",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "violet",
    releaseDate: "2026-10-24",
    playtime: "1-3 min",
    difficulty: "High speed",
    aspect: "16 / 10",
  },
  {
    id: "nx-014",
    slug: "robot-target-arena",
    title: "Robot Target Arena",
    tagline: "Sixty seconds of clean reads.",
    description:
      "A focused training-range challenge against original utility robots. Track moving targets, crack armoured units and build a multiplier before the sixty-second clock runs out.",
    category: "Shooting",
    categories: ["Shooting", "Action", "Kids"],
    thumbnail: "/assets/images/games/robot-target-arena.svg",
    thumbnailAlt:
      "Original robot training range key art with geometric robots, target bays and a crosshair.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Aim with the pointer and click or tap to fire. Keyboard players can move the crosshair with the arrow keys or WASD and fire with Space or Enter. Scouts go down in one hit, zippers drift quickly and brutes need two hits. A miss resets the combo; the run lasts sixty seconds.",
    controls: [
      { label: "Aim", value: "Mouse / touch / Arrow keys / WASD" },
      { label: "Fire", value: "Click / tap / Space / Enter" },
      { label: "Pause", value: "P or the pause button" },
    ],
    featured: false,
    featuredRank: 14,
    curated: true,
    status: "ready",
    module: "robot-target-arena",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "coral",
    releaseDate: "2026-10-24",
    playtime: "60 sec",
    difficulty: "Aim + timing",
    aspect: "16 / 10",
  },
  {
    id: "nx-015",
    slug: "rpg-car-game",
    title: "RPG Car Game",
    tagline: "Off-road terrain, web-first.",
    description: "Procedurally driven off-road driving across desert and forest biomes. Explore varied terrain, test traction, and experiment with vehicle behavior in a WebGPU-powered 3D environment.",
    category: "Racing",
    categories: ["Racing", "Simulation", "Action"],
    thumbnail: "/assets/images/games/rpg-car-game.svg",
    thumbnailAlt: "Original abstract key art showing a rugged off-road vehicle on a textured terrain.",
    sourceType: "iframe",
    embedUrl: "/games/rpg-car-game/index.html",
    instructions: "Drive with WASD or Arrow keys. Shift for boost, Space to jump, R to reset, U for shop, P for debug, O for orbit camera. Runs best with WebGPU; Three.js falls back to WebGL2 if unavailable.",
    controls: [
      { label: "Drive", value: "WASD / Arrow keys" },
      { label: "Boost", value: "Shift" },
      { label: "Jump", value: "Space" },
      { label: "Reset", value: "R" }
    ],
    featured: false,
    featuredRank: 15,
    curated: true,
    status: "ready",
    module: null,
    developerOrProvider: "Sam Wilson (original), integrated by Robloxsplay",
    licenseReference: "Original work by Sam Wilson (MIT). See THIRD_PARTY_LICENSES.md for dependencies.",
    accent: "orange",
    releaseDate: "2026-10-24",
    playtime: "Open-ended",
    difficulty: "Driving",
    aspect: "16 / 9"
  }
,
  {
    id: "nx-016",
    slug: "ruin-runner-3d",
    title: "Ruin Runner 3D",
    tagline: "Outrun the ruins.",
    description:
      "A full 3D moonlit endless runner. Guide the last temple automaton across a broken causeway, read three lanes, jump stone blocks, slide under gate beams, collect sun coins and chase the horizon as the ruins accelerate.",
    category: "Runner",
    categories: ["Runner", "Adventure", "Arcade"],
    thumbnail: "/assets/images/games/ruin-runner-3d.png",
    thumbnailAlt: "3D moonlit temple automaton running along a stone causeway.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Run with the arrow keys or WASD, or swipe on touch. Space or Up jumps, Down slides, P pauses and R restarts. Change lanes to avoid totems, jump low stone blocks and slide under vine gates. Collect coins and power-ups; the trail gets faster.",
    controls: [
      { label: "Lanes", value: "Left / Right or A / D" },
      { label: "Jump", value: "Up / Space / swipe up" },
      { label: "Slide", value: "Down / S / swipe down" },
      { label: "Pause", value: "P or Escape" },
    ],
    featured: false,
    featuredRank: 16,
    curated: true,
    status: "ready",
    module: "endless-runner",
    renderer: "3d",
    bestLabel: "Best score",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "lime",
    releaseDate: "2026-10-25",
    playtime: "1-4 min",
    difficulty: "Reflex + rhythm",
    aspect: "16 / 10"
  },
  {
    id: "nx-017",
    slug: "tic-tac-toe",
    title: "Tic Tac Toe",
    tagline: "Three in a row. No mercy.",
    description:
      "A premium three-in-a-row duel on a glowing glass board. Play a friend on the same device or face a real minimax computer that never gives a line away. Choose X or O, pick Easy, Medium or Impossible and chase the clean sweep.",
    category: "Board",
    categories: ["Board", "Strategy", "Classic"],
    thumbnail: "/assets/images/games/tic-tac-toe.png",
    thumbnailAlt: "Neon Tic Tac Toe board with cyan X and violet O marks on a dark glass interface.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Choose 2 Players or vs Computer, then enter the arena. In a two-player round, X starts and players alternate clicking empty cells. Against the computer, choose X or O and an Easy, Medium or Impossible difficulty. Build a line of three, or block your rival, before the board fills. Scores persist on this device until you reset them.",
    controls: [
      { label: "Place mark", value: "Click / tap / Enter" },
      { label: "Move focus", value: "Tab / Shift+Tab" },
      { label: "Restart round", value: "R" },
      { label: "Fullscreen", value: "F" }
    ],
    featured: false,
    featuredRank: 17,
    curated: true,
    status: "ready",
    module: "tic-tac-toe",
    renderer: "dom",
    bestLabel: "Best",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay.",
    accent: "cyan",
    releaseDate: "2026-10-25",
    playtime: "1-3 min",
    difficulty: "Turn-based / logic",
    aspect: "16 / 10"
  },
  {
    id: "nx-018",
    slug: "royal-wood-3d-chess",
    title: "Royal Wood 3D Chess",
    tagline: "A carved set. Three quiet rooms. One royal line.",
    description:
      "A premium 3D chess set carved from light maple and dark walnut. Play a friend or Stockfish, choose White or Black, and move between a warm wooden study, a sunlit forest and a dark royal room. Full chess rules, animated pieces, orbit camera, promotion, move history and undo.",
    category: "Board",
    categories: ["Board", "Strategy", "Classic"],
    thumbnail: "/assets/images/games/royal-wood-3d-chess.png",
    thumbnailAlt: "Premium 3D wooden chess set on a polished walnut and maple board in a warm study.",
    sourceType: "custom",
    embedUrl: null,
    instructions:
      "Drag empty space to orbit and scroll to zoom. Click or tap a piece to reveal its legal squares, then click or tap a destination; on desktop you can also drag a piece directly. Choose White or Black against the computer and an Easy, Medium or Hard opponent. Castling, en passant, promotion, check, checkmate, stalemate, repetition and the fifty-move rule are enforced.",
    controls: [
      { label: "Select / move", value: "Click, tap or drag" },
      { label: "Orbit camera", value: "Drag empty space" },
      { label: "Zoom", value: "Scroll / pinch" },
      { label: "Undo", value: "Undo button" }
    ],
    featured: false,
    featuredRank: 18,
    curated: true,
    status: "ready",
    module: "royal-wood-chess",
    renderer: "3d",
    bestLabel: "Best",
    developerOrProvider: "Robloxsplay Studio",
    licenseReference: "Original work created in-house for Robloxsplay. Stockfish 10 is GPL-3.0; chess.js is BSD-2-Clause; wood textures are Poly Haven CC0. See THIRD_PARTY_LICENSES.md.",
    accent: "lime",
    releaseDate: "2026-10-25",
    playtime: "5-20 min",
    difficulty: "Strategy / AI",
    aspect: "16 / 10"
  },
  {
    id: "nx-019",
    slug: "cooking-love-chef-restaurant",
    title: "Cooking Love Chef Restaurant",
    tagline: "Own the rush, one plate at a time.",
    description:
      "Step into a bright, busy kitchen and keep the pass moving. Take orders, prep ingredients, cook each dish to the right moment and get it to the table before patience runs out. Earn enough to upgrade stations, unlock new recipes and open the next restaurant.",
    category: "Cooking",
    categories: ["Cooking", "Simulation"],
    thumbnail: "https://www.madkidgames.com/games/cooking-love-chef-restaurant/thumb_2.jpg",
    thumbnailAlt: "Official Cooking Love Chef Restaurant cover art.",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/cooking-love-chef-restaurant",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/cooking-love-chef-restaurant",
    providerAttribution:
      "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    instructions:
      "Desktop: left-click to take orders, cook and serve dishes, then use the upgrade screens to improve your kitchen. Mobile: tap and drag to prepare food, serve customers and manage the restaurant. Keep an eye on customer patience, work through the queue and spend earnings on better equipment before the next rush.",
    controls: [
      { label: "Desktop", value: "Mouse / left-click" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Serve before patience runs out" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 19,
    curated: true,
    status: "ready",
    module: null,
    allowFullscreen: true,
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference:
      "Cooking Love Chef Restaurant is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "orange",
    releaseDate: "2026-10-27",
    playtime: "5-15 min",
    difficulty: "Time management",
    aspect: "16 / 9"
  },
  {
    id: "nx-020",
    slug: "subway-surfers",
    title: "Subway Surfers",
    tagline: "Run the rails. Chase the next carriage.",
    description:
      "Play Subway Surfers online in this fast-paced endless runner. Dodge trains and barriers, jump over obstacles, slide under hazards, switch lanes, and collect coins and power-ups. Keep running as the speed increases and try to beat your high score. The game features colorful subway environments, quick reflex challenges, and exciting arcade gameplay.",
    category: "3D",
    categories: ["3D", "Runner", "Casual"],
    thumbnail: "https://www.madkidgames.com/games/subway-surfers/thumb_2.jpg",
    thumbnailAlt: "Official Subway Surfers cover art.",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/subway-surfers",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/subway-surfers",
    providerAttribution:
      "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["3d", "runner", "casual", "subway-surfers", "subway", "surfers", "run", "run-surf", "subway-surf"],
    instructions:
      "Desktop: use the arrow keys or WASD to switch lanes, jump and slide. Mobile: swipe left or right to change lanes, swipe up to jump and swipe down to slide. Dodge trains and barriers, collect coins and power-ups, and keep the run alive as the speed increases.",
    controls: [
      { label: "Desktop", value: "Arrow keys / WASD" },
      { label: "Mobile", value: "Swipe" },
      { label: "Goal", value: "Run, dodge and collect" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 20,
    curated: true,
    status: "ready",
    module: null,
    renderer: "3d",
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference:
      "Subway Surfers is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "cyan",
    releaseDate: "2026-10-27",
    playtime: "2-10 min",
    difficulty: "Endless runner",
    aspect: "16 / 9"
  },
  {
    id: "nx-021",
    slug: "pepi-hospital-learn-and-care",
    title: "Pepi Hospital Learn and Care",
    tagline: "A little hospital with a lot to discover.",
    description:
      "Explore a colorful interactive hospital in this creative simulation game. Visit different medical departments, meet doctors, nurses, and patients, interact with equipment, and create your own healthcare stories. Discover hospital rooms, activities, and surprises while enjoying educational role-playing and imaginative gameplay.",
    category: "Kids",
    categories: ["Kids", "Educational", "Simulation"],
    thumbnail: "https://www.madkidgames.com/games/pepi-hospital-learn-and-care/thumb_2.jpg",
    thumbnailAlt: "Official Pepi Hospital Learn and Care cover art.",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/pepi-hospital-learn-and-care",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/pepi-hospital-learn-and-care",
    providerAttribution:
      "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["kids", "kid", "educational", "pepi", "pepi-game", "pepi-hospital", "pepi-learn", "pepi-care"],
    instructions:
      "Desktop: click rooms, characters and equipment to explore and interact. Mobile: tap and drag objects and characters around the hospital. Visit different departments, discover activities and build your own gentle healthcare stories at your own pace.",
    controls: [
      { label: "Desktop", value: "Click and drag" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Explore, interact and imagine" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 21,
    curated: true,
    status: "ready",
    module: null,
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference:
      "Pepi Hospital Learn and Care is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "violet",
    releaseDate: "2026-10-27",
    playtime: "5-20 min",
    difficulty: "Creative / educational",
    aspect: "16 / 9"
  },
  {
    id: "nx-022",
    slug: "toca-boca-life-neighborhood",
    title: "Toca Boca Life Neighborhood",
    tagline: "Build a neighborhood of your own.",
    description: "Play Toca Boca Life Neighborhood free online and build your dream neighborhood with apartments, cafés, friends, and endless creative stories. A creative sandbox role-playing game where you decorate apartments, meet neighbors, visit cafés, and create your own neighborhood adventures.\n\nToca Boca Life Neighborhood is a creative sandbox role-playing game where your imagination transforms an ordinary neighborhood into endless adventures. Play free online in your browser and design beautiful apartments, meet friendly neighbors, and create fun everyday stories with dozens of interactive characters.\n\nMove into one of four unique apartments, each featuring its own distinct style including minimalist, cute, bohemian, and industrial themes. Decorate your new home exactly the way you like by arranging furniture, placing decorations, and creating the perfect living space for your characters.\n\nVisit the interior design store to browse a huge collection of furniture and decorative items. Discover plants, clocks, pillows, paintings, stools, mailboxes, and countless other objects that allow you to personalize every room. Before leaving, stop by the photo booth to capture fun memories with your friends using a variety of entertaining photo filters.\n\nSpend time relaxing at the Rob-o Café where friends gather to eat, chat, and enjoy delicious food. Pick meals directly from the moving conveyor belt or order refreshing smoothies from the giant smoothie robot, choosing from four tasty flavors to enjoy during your visit.\n\nMeet 23 charming characters and create your own neighborhood stories. Invite friends over, visit neighbors, decorate multiple apartments, host parties, or simply spend the day exploring and interacting with everything around you. Every object can be picked up, moved, combined, and used however your imagination allows.\n\nDon't forget to try the Slothtato toy machine, where you can collect an adorable sloth toy while exploring the neighborhood. Small surprises and hidden interactions are scattered throughout every location, rewarding curious players who love to experiment.\n\nWith colorful visuals, interactive environments, charming characters, and unlimited role-playing possibilities, Toca Boca Life Neighborhood provides a relaxing and family-friendly sandbox experience without goals, timers, or pressure.\n\nDesigned as a smooth HTML5 experience, Toca Boca Life Neighborhood runs directly in your browser on desktop and mobile devices. Whether you're searching for free browser sandbox games, unblocked role-playing games, or creative life simulation adventures online, this title offers endless neighborhood fun anytime, anywhere.\n\nMove in, decorate your dream apartment, meet your neighbors, and create unforgettable stories in Toca Boca Life Neighborhood!\n\nGameplay Overview\t\n• Move into stylish apartments 🏡\n• Decorate your home with furniture 🛋️\n• Visit the Rob-o Café ☕\n• Meet 23 unique characters 👥\n• Create unlimited neighborhood stories ✨\n\nMain Features\t\n• Four themed apartments 🏠\n• 23 interactive characters 👥\n• Interior design store 🛋️\n• Rob-o Café with conveyor belt food 🤖🍔\n• Smoothie robot with four flavors 🥤\n• Photo booth and Slothtato toy machine 📸🦥\n\nWhy You’ll Love It\t\n• Play free online instantly 🎮\n• Endless creative storytelling ✨\n• Decorate and customize apartments 🏡\n• Family-friendly sandbox gameplay ❤️\n• Perfect for unblocked games 🏫",
    category: "Kids",
    categories: ["Kids","Simulation","Casual"],
    thumbnail: "https://www.madkidgames.com/games/toca-boca-life-neighborhood/thumb_2.jpg",
    thumbnailAlt: "Official Toca Boca Life Neighborhood cover art.",
    previewVideo: "https://www.madkidgames.com/files/videos/toca-boca-life-neighborhood.mp4",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/toca-boca-life-neighborhood",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/toca-boca-life-neighborhood",
    providerAttribution: "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["kids","kid","toca","toca-boca","toca-life","toca-kids","kid-toca","boca-toca"],
    instructions: "Desktop: click apartments, characters and objects to decorate and interact. Mobile: tap and drag objects, characters and rooms to build your neighborhood story. Visit the cafe, design store and photo booth, and create your own everyday adventures.",
    controls: [
      { label: "Desktop", value: "Click / keyboard" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Explore, decorate and create" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 22,
    curated: true,
    status: "ready",
    module: null,
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference: "Toca Boca Life Neighborhood is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "violet",
    releaseDate: "2026-10-27",
    playtime: "5-20 min",
    difficulty: "Creative / sandbox",
    aspect: "16 / 9"
  },
  {
    id: "nx-023",
    slug: "world-cricket-championship-wcc-lite",
    title: "World Cricket Championship WCC Lite",
    tagline: "Take the crease. Chase the trophy.",
    description: "Play World Cricket Championship WCC Lite free online and experience the excitement of professional cricket with thrilling matches, realistic gameplay, and competitive tournaments. Step onto the field, represent your favorite team, master batting and bowling skills, and compete for glory in one of the most exciting cricket adventures available.\n\nWorld Cricket Championship WCC Lite is an immersive sports simulation game that combines realistic cricket mechanics, strategic gameplay, and exciting match action into an unforgettable experience. Play free online in your browser and enjoy intense cricket matches across stunning stadiums packed with passionate fans and competitive opponents.\n\nTake control of your team and experience every aspect of the game. Step up to the crease as a batsman, score boundaries, build partnerships, and guide your team toward victory. Every shot requires timing, precision, and smart decision-making.\n\nBowling is equally important to success. Deliver accurate balls, outsmart opposing batsmen, and take crucial wickets that can change the momentum of a match. Strategic bowling choices can make all the difference during tense encounters.\n\nCompete in a variety of cricket formats and challenges that test your abilities in different situations. Whether you're chasing a target, defending a score, or participating in tournament competitions, every match offers a unique and rewarding experience.\n\nThe realistic gameplay mechanics allow players to experience the excitement of cricket from multiple perspectives. Bat, bowl, field, and captain your team while making important decisions that influence the outcome of every game.\n\nAs you progress through the adventure, you'll improve your skills and unlock new opportunities. Achieve impressive performances, complete objectives, and develop your cricketing abilities while building your reputation as a world-class player.\n\nEvery stadium provides an authentic atmosphere that captures the excitement of professional cricket. The crowd reactions, match situations, and dynamic gameplay create an engaging sporting experience that keeps every contest exciting.\n\nThe realistic graphics, responsive controls, and engaging cricket action make World Cricket Championship WCC Lite a fantastic experience for sports fans. Whether you're hitting sixes, taking wickets, or leading your team to victory, every match is packed with excitement.\n\nDesigned as a seamless HTML5 experience, World Cricket Championship WCC Lite runs directly in your browser on desktop, mobile, and tablet devices. If you enjoy cricket games, sports simulations, competitive tournaments, or realistic sporting action, this game is the perfect choice.\n\nGrab your bat, lead your team, and become a cricket legend in World Cricket Championship WCC Lite!\n\nGameplay Overview\n• Play realistic cricket matches 🏏\n• Bat, bowl, and field like a professional ⭐\n• Compete in exciting tournaments and challenges 🏆\n• Master advanced cricket techniques 🎯\n• Experience authentic stadium atmospheres 🏟️\n• Lead your team to victory and glory 👑\n\nMain Features\n• Realistic cricket simulation gameplay 🏏\n• Batting, bowling, and fielding mechanics ⭐\n• Multiple match formats and tournaments 🏆\n• Detailed stadiums and match environments 🏟️\n• Strategic gameplay and team management 🎯\n• Smooth controls and responsive action 🎮\n• Engaging progression and rewards system ⭐\n\nWhy You’ll Love It\n• Play free online instantly 🎮\n• Experience authentic cricket action 🏏\n• Compete in thrilling matches and tournaments 🏆\n• Master batting and bowling skills ⭐\n• Lead your favorite team to victory 👑\n• Perfect for cricket and sports game fans 🏆\n",
    category: "Sports",
    categories: ["Sports","Cricket","3D","Simulation"],
    thumbnail: "https://www.madkidgames.com/games/world-cricket-championship-wcc-lite/thumb_2.jpg",
    thumbnailAlt: "Official World Cricket Championship WCC Lite cover art.",
    previewVideo: "https://www.madkidgames.com/files/videos/world-cricket-championship-wcc-lite.mp4",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/world-cricket-championship-wcc-lite",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/world-cricket-championship-wcc-lite",
    providerAttribution: "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["world","cricket","world-cricket","wcc","sport","sports","wcc-lite","cricket-3d","wcc-cricket"],
    instructions: "Desktop: use the on-screen cricket controls to bat, bowl and field, and follow the match prompts. Mobile: tap the controls to time shots, deliver balls and take wickets. Build partnerships, protect your wicket and chase the target.",
    controls: [
      { label: "Desktop", value: "Click / keyboard" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Bat, bowl and win the match" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 23,
    curated: true,
    status: "ready",
    module: null,
    renderer: "3d",
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference: "World Cricket Championship WCC Lite is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "cyan",
    releaseDate: "2026-10-27",
    playtime: "5-20 min",
    difficulty: "Sports / simulation",
    aspect: "16 / 9"
  },
  {
    id: "nx-024",
    slug: "it-girl-story-celebrity-life",
    title: "It Girl Story - Celebrity Life",
    tagline: "From newcomer to front row.",
    description: "Play It Girl Story Celebrity Life free online and become the ultimate fashion celebrity. A glamorous fashion and lifestyle simulation where you rise from newcomer to superstar through style, shopping, parties, modeling, and celebrity adventures.\n\nIt Girl Story - Celebrity Life is a stylish celebrity life simulator where you build your reputation, expand your wardrobe, attend exclusive parties, and become the most talked-about fashion icon in town. Play free online in your browser and begin your journey toward fame, fashion, and stardom.\n\nStart your story as an aspiring fashionista and work your way up the social ladder. Shop for trendy outfits, discover new styles, and create stunning looks that will impress everyone around you. Whether you're attending glamorous parties, going on shopping sprees, or preparing for celebrity appearances, every decision helps shape your rise to fame.\n\nVisit exciting locations, complete jobs, improve your social status, and build important skills such as education, fitness, and popularity. As your reputation grows, more opportunities become available, allowing you to unlock new experiences and exclusive rewards.\n\nCustomize your character with fashionable clothing, stylish accessories, glamorous makeup, and countless cosmetic options. Create your own unique celebrity look and show off your style everywhere you go.\n\nMeet new friends, receive party invitations, complete activities, and progress through a fun social adventure filled with fashion, fame, and exciting events. Collect rare outfits and expand your wardrobe to become the ultimate trendsetter.\n\nEarn cash and diamonds to unlock premium items, improve your lifestyle, and advance faster through the celebrity world. Continue leveling up, increasing your rank, and becoming the next big star everyone admires.\n\nWith vibrant visuals, extensive customization, social progression systems, and endless fashion choices, It Girl Story - Celebrity Life offers an entertaining celebrity simulation experience for players who love fashion, style, and role-playing adventures.\n\nDesigned as a smooth HTML5 experience, It Girl Story - Celebrity Life runs directly in your browser on desktop and mobile devices. Whether you're searching for free browser fashion games, unblocked simulation games, or celebrity life adventures online, this title delivers hours of stylish entertainment anytime, anywhere.\n\nBuild your reputation, show off your style, and become the next It Girl superstar!\n\nGameplay Overview\t\n• Create your celebrity lifestyle ✨\n• Shop for fashionable outfits 👗\n• Attend parties and social events 🎉\n• Improve skills and rank up ⭐\n• Become a famous fashion icon 🌟\n\nMain Features\t\n• Huge wardrobe collection 👗\n• Fashion and makeover customization 💄\n• Celebrity lifestyle progression 🌟\n• Shopping and social activities 🛍️\n• Jobs, parties, and events 🎉\n• Leveling and ranking systems ⭐\n\nWhy You’ll Love It\t\n• Play free online instantly 🎮\n• Tons of fashion choices 👗\n• Fun celebrity progression 🌟\n• Customize your own style 💄\n• Perfect for unblocked games 🏫",
    category: "Girls",
    categories: ["Girls","Simulation","Casual"],
    thumbnail: "https://www.madkidgames.com/games/it-girl-story-celebrity-life/thumb_2.jpg",
    thumbnailAlt: "Official It Girl Story - Celebrity Life cover art.",
    previewVideo: "https://www.madkidgames.com/files/videos/it-girl-story-celebrity-life.mp4",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/it-girl-story-celebrity-life",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/it-girl-story-celebrity-life",
    providerAttribution: "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["girl","girls","girl-story","girls-story","celebrity-life","girl-celebrity","girl-life"],
    instructions: "Desktop: click to shop, dress your character, accept invitations, complete jobs and improve your social status. Mobile: tap and drag through outfits, locations and activities. Build your reputation, collect outfits and become a celebrity.",
    controls: [
      { label: "Desktop", value: "Click / keyboard" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Style, socialise and rise to fame" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 24,
    curated: true,
    status: "ready",
    module: null,
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference: "It Girl Story - Celebrity Life is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "violet",
    releaseDate: "2026-10-27",
    playtime: "5-20 min",
    difficulty: "Fashion / social sim",
    aspect: "16 / 9"
  },
  {
    id: "nx-025",
    slug: "free-kick-football-3d-soccer",
    title: "Free Kick Football 3D Soccer",
    tagline: "Bend it into the top corner.",
    description: "Play Free Kick Football 3D Soccer online. Aim and power free kicks, curve shots around defensive walls, overcome goalkeepers, complete challenges, and improve your shooting accuracy in 3D football environments.",
    category: "Sports",
    categories: ["Sports","Football","Soccer","3D"],
    thumbnail: "https://www.madkidgames.com/games/free-kick-football-3d-soccer/thumb_2.jpg",
    thumbnailAlt: "Official Free Kick Football 3D Soccer cover art.",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/free-kick-football-3d-soccer",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/free-kick-football-3d-soccer",
    providerAttribution: "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["3d","sports","free-kick","football","soccer","kick"],
    instructions: "Desktop: aim with the mouse, set the shot power and curve, then release to take the free kick. Mobile: swipe or tap to aim and strike. Read the wall and goalkeeper, find the open corner and complete the challenge.",
    controls: [
      { label: "Desktop", value: "Mouse / keyboard" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Score the free kick" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 25,
    curated: true,
    status: "ready",
    module: null,
    renderer: "3d",
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference: "Free Kick Football 3D Soccer is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "cyan",
    releaseDate: "2026-10-27",
    playtime: "2-10 min",
    difficulty: "Football / accuracy",
    aspect: "16 / 9"
  },
  {
    id: "nx-026",
    slug: "offroad-outlaws",
    title: "Offroad Outlaws",
    tagline: "Find the line through the mud.",
    description: "Play Offroad Outlaws online and drive across challenging off-road terrain, muddy routes, rocky tracks, steep hills, and obstacle courses. Experience vehicle handling and off-road driving challenges.",
    category: "Racing",
    categories: ["Racing","Driving","Off-Road","3D"],
    thumbnail: "https://www.madkidgames.com/games/offroad-outlaws/thumb_2.jpg",
    thumbnailAlt: "Official Offroad Outlaws cover art.",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/offroad-outlaws",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/offroad-outlaws",
    providerAttribution: "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["car","drive","race","offroad","offroad-outlaws","outlaws-offroad","offroad-racing","offraod-car"],
    instructions: "Desktop: use the on-screen driving controls or keyboard to accelerate, brake and steer across the terrain. Mobile: use the touch controls to drive and balance the vehicle. Keep momentum over rocks, mud and steep climbs.",
    controls: [
      { label: "Desktop", value: "Mouse / keyboard" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Reach the end of the trail" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 26,
    curated: true,
    status: "ready",
    module: null,
    renderer: "3d",
    allowFullscreen: true,
    playability: "provider-blocked",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference: "Offroad Outlaws is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "orange",
    releaseDate: "2026-10-27",
    playtime: "5-20 min",
    difficulty: "Off-road driving",
    aspect: "16 / 9"
  },
  {
    id: "nx-027",
    slug: "hot-wheels-race-off",
    title: "Hot Wheels Race Off",
    tagline: "Jump the track. Stick the landing.",
    description: "Play Hot Wheels Race Off online and race across stunt tracks, ramps, hills, jumps, and obstacles. Control your car, maintain balance, collect rewards, and complete racing challenges.",
    category: "Racing",
    categories: ["Racing","Driving","3D"],
    thumbnail: "https://www.madkidgames.com/games/hot-wheels-race-off/thumb_2.jpg",
    thumbnailAlt: "Official Hot Wheels Race Off cover art.",
    sourceType: "iframe",
    embedUrl: "https://www.madkidgames.com/full/hot-wheels-race-off",
    provider: "MadKidGames",
    providerUrl: "https://www.madkidgames.com/game/hot-wheels-race-off",
    providerAttribution: "Official MadKidGames embed. Game and artwork remain with MadKidGames and its licensors.",
    tags: ["3d","car","driving","drive","car-race","race","hot-wheels","race-off","car-drive"],
    instructions: "Desktop: use the on-screen controls or keyboard to accelerate, brake and balance the car through ramps and loops. Mobile: tap the driving controls to accelerate, brake and keep the car level. Collect rewards and finish the stunt track.",
    controls: [
      { label: "Desktop", value: "Mouse / keyboard" },
      { label: "Mobile", value: "Tap and drag" },
      { label: "Goal", value: "Race the stunt track" },
      { label: "Fullscreen", value: "Player button" }
    ],
    featured: false,
    featuredRank: 27,
    curated: true,
    status: "ready",
    module: null,
    renderer: "3d",
    allowFullscreen: true,
    playability: "provider-slow",
    developerOrProvider: "MadKidGames (third-party)",
    licenseReference: "Hot Wheels Race Off is embedded with MadKidGames' official iframe code. Game files, artwork, trademarks and code remain with MadKidGames and its licensors. Robloxsplay does not host or modify the game. The MadKidGames ads.txt record is present; provider domain approval remains pending.",
    accent: "violet",
    releaseDate: "2026-10-27",
    playtime: "3-10 min",
    difficulty: "Stunt racing",
    aspect: "16 / 9"
  }
];

export const INTEGRATION_STATUS = {
  target: 15,
  authorized: 9,
  published: 9,
  note:
    "Nine authorised third-party embeds are published, all via MadKidGames: Cooking Love Chef Restaurant, Subway Surfers, Pepi Hospital Learn and Care, Toca Boca Life Neighborhood, World Cricket Championship WCC Lite, It Girl Story - Celebrity Life, Free Kick Football 3D Soccer, Offroad Outlaws and Hot Wheels Race Off. Each uses the provider's official iframe URL and attribution. The MadKidGames ads.txt record is present; provider domain approval remains pending. No site AdSense code was added.",
};

export const slugifyCategory = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function getGameBySlug(slug) {
  return GAMES.find((game) => game.slug === slug) || null;
}

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((category) => category.slug === slug) || null;
}

export function getPopulatedCategories() {
  return CATEGORIES.map((category) => {
    const games = GAMES.filter((game) =>
      game.categories.some((name) => slugifyCategory(name) === category.slug),
    );
    return { ...category, count: games.length };
  }).filter((category) => category.count > 0);
}

export function getGamesByCategory(slug) {
  if (!slug || slug === "all") return [...GAMES];
  return GAMES.filter((game) =>
    game.categories.some((name) => slugifyCategory(name) === slug),
  );
}

export function getFeaturedGames() {
  return GAMES.filter((game) => game.featured).sort(
    (a, b) => a.featuredRank - b.featuredRank,
  );
}

export function getCuratedGames(exclude = []) {
  return GAMES.filter((game) => game.curated && !exclude.includes(game.slug)).sort(
    (a, b) => a.featuredRank - b.featuredRank,
  );
}

export function getRelatedGames(game, limit = 3) {
  if (!game) return [];
  const matches = GAMES.filter(
    (candidate) =>
      candidate.slug !== game.slug &&
      candidate.categories.some((name) => game.categories.includes(name)),
  )
    .map((candidate) => {
      const score = candidate.categories.reduce((total, name) => {
        const index = game.categories.indexOf(name);
        if (index === -1) return total;
        return total + (index === 0 ? 3 : index === 1 ? 2 : 1);
      }, 0);
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ candidate }) => candidate);
  if (matches.length >= limit) return matches.slice(0, limit);
  const fallback = GAMES.filter(
    (candidate) =>
      candidate.slug !== game.slug && !matches.some((match) => match.slug === candidate.slug),
  );
  return [...matches, ...fallback].slice(0, limit);
}

export function searchGames(query, games = GAMES) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...games];
  const terms = needle.split(/\s+/).filter(Boolean);
  return games
    .map((game) => {
      const haystack = [
        game.title,
        game.description,
        game.tagline,
        game.category,
        ...game.categories,
        ...(game.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((total, term) => {
        if (game.title.toLowerCase().includes(term)) return total + 5;
        if (game.categories.join(" ").toLowerCase().includes(term)) return total + 3;
        if (haystack.includes(term)) return total + 1;
        return total;
      }, 0);
      return { game, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.game);
}

export function sortGames(games, sort = "curated") {
  const copy = [...games];
  if (sort === "title") return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "newest") {
    return copy.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  }
  return copy.sort((a, b) => a.featuredRank - b.featuredRank);
}


