// ASTRO LAB — Solar System data
// Physical values: NASA Planetary Fact Sheets (nssdc.gsfc.nasa.gov/planetary/factsheet),
// NASA Science solar-system pages, and ESA. Moon counts are as of 2025 and change as
// new discoveries are confirmed.
//
// `orbit.L0` is the planet's mean longitude at the J2000 epoch (degrees). The game uses
// circular orbits with these mean longitudes and real orbital periods, so positions are a
// rough approximation of "today", not a precise ephemeris.
//
// `vis` holds VISUAL game-scale values only (radius / distance in scene units). They are
// deliberately enlarged / compressed and are NOT physically to scale.

export const AU_KM = 149597870.7;

export const BODIES = [
  {
    id: 'sun', name: 'Sun', type: 'star', classification: 'G-type main-sequence star (G2V)',
    vis: { radius: 5, dist: 0, tex: 'sun', tilt: 7.25 },
    rotationHours: 609.1,
    distanceFromEarth: '1 AU (≈149.6 million km; light takes ≈8 min 20 s)',
    discovery: 'Known since prehistory.',
    data: {
      distance: 'Centre of the solar system (≈26,000 light-years from the Milky Way\'s centre)',
      orbitalPeriod: '≈230 million years to orbit the Milky Way\'s centre',
      rotationPeriod: '≈25 days at the equator, ≈35 days near the poles',
      diameter: '1,392,700 km (109 × Earth)',
      mass: '1.989 × 10³⁰ kg (333,000 × Earth; 99.8% of the solar system\'s mass)',
      temperature: 'Surface (photosphere) ≈5,500 °C; core ≈15 million °C; corona >1 million °C',
      atmosphere: 'Plasma: ≈73% hydrogen, ≈25% helium by mass, plus traces of heavier elements',
      moons: '8 planets, 5 recognised dwarf planets and countless small bodies orbit it',
      missions: 'SOHO, Solar Dynamics Observatory, Parker Solar Probe, Solar Orbiter, Aditya-L1',
      significance: 'Nuclear fusion in its core turns ≈4 million tonnes of matter into energy every second, powering nearly all life on Earth.',
      facts: [
        'About 1.3 million Earths could fit inside the Sun.',
        'Sunlight reaching you now left the Sun\'s surface about 8 minutes 20 seconds ago.',
        'The Sun is about 4.6 billion years old — roughly halfway through its main-sequence life.'
      ]
    },
    quiz: [
      { q: 'How long does sunlight take to reach Earth?', options: ['8 seconds', 'About 8 minutes 20 seconds', 'About 1 hour', 'About 1 day'], answer: 1, explain: 'At 1 AU and the speed of light (≈300,000 km/s), the trip takes ≈499 seconds.' },
      { q: 'What powers the Sun?', options: ['Burning coal-like chemistry', 'Nuclear fission of uranium', 'Nuclear fusion of hydrogen into helium', 'Gravitational lightning'], answer: 2, explain: 'In the core, hydrogen nuclei fuse into helium, releasing energy (E = mc²).' },
      { q: 'What fraction of the solar system\'s mass is in the Sun?', options: ['About 50%', 'About 75%', 'About 90%', 'About 99.8%'], answer: 3, explain: 'Jupiter holds most of what remains.' }
    ]
  },
  {
    id: 'mercury', name: 'Mercury', type: 'planet', classification: 'Terrestrial planet',
    vis: { radius: 0.42, dist: 29, tex: 'mercury', tilt: 0.03 },
    orbit: { au: 0.387, periodDays: 87.97, L0: 252.25 },
    rotationHours: 1407.6,
    distanceFromEarth: '77 million – 222 million km',
    discovery: 'Known since antiquity; observed by Assyrian astronomers by the 14th century BCE.',
    data: {
      distance: '57.9 million km (0.39 AU)',
      orbitalPeriod: '88 Earth days',
      rotationPeriod: '58.6 Earth days (one solar day lasts 176 Earth days)',
      diameter: '4,879 km',
      mass: '3.30 × 10²³ kg (0.055 × Earth)',
      temperature: '−173 °C at night to 427 °C by day',
      atmosphere: 'Thin exosphere of oxygen, sodium, hydrogen, helium and potassium',
      moons: '0',
      missions: 'Mariner 10 (NASA, 1974–75), MESSENGER (NASA, 2011–15 orbiter), BepiColombo (ESA/JAXA, en route)',
      significance: 'Its huge iron core (≈85% of its radius) helps scientists understand how rocky planets form.',
      facts: [
        'Mercury is the smallest planet and the closest to the Sun.',
        'Despite being closest to the Sun, it is not the hottest planet — Venus is.',
        'MESSENGER found water ice in permanently shadowed craters near the poles.'
      ]
    },
    quiz: [
      { q: 'How long is a year on Mercury?', options: ['88 Earth days', '225 Earth days', '365 Earth days', '58 Earth days'], answer: 0, explain: 'Mercury orbits the Sun in about 88 days — the fastest of all planets.' },
      { q: 'Which planet is hotter than Mercury despite being farther from the Sun?', options: ['Mars', 'Venus', 'Earth', 'Jupiter'], answer: 1, explain: 'Venus\'s thick CO₂ atmosphere traps heat (runaway greenhouse effect).' },
      { q: 'What did MESSENGER find in Mercury\'s polar craters?', options: ['Liquid lakes', 'Water ice', 'Volcanoes erupting', 'Fossils'], answer: 1, explain: 'Permanently shadowed craters stay cold enough to hold water ice.' }
    ]
  },
  {
    id: 'venus', name: 'Venus', type: 'planet', classification: 'Terrestrial planet',
    vis: { radius: 0.72, dist: 35.5, tex: 'venus', tilt: 177.4 },
    orbit: { au: 0.723, periodDays: 224.70, L0: 181.98 },
    rotationHours: -5832.5,
    distanceFromEarth: '38 million – 261 million km (the closest planet to Earth at its nearest)',
    discovery: 'Known since antiquity; the brightest natural object in the night sky after the Moon.',
    data: {
      distance: '108.2 million km (0.72 AU)',
      orbitalPeriod: '224.7 Earth days',
      rotationPeriod: '243 Earth days, retrograde (spins backwards)',
      diameter: '12,104 km',
      mass: '4.87 × 10²⁴ kg (0.815 × Earth)',
      temperature: 'About 464 °C at the surface — hot enough to melt lead',
      atmosphere: '96.5% carbon dioxide, 3.5% nitrogen; clouds of sulfuric acid; surface pressure ≈92 × Earth',
      moons: '0',
      missions: 'Venera 7 (first landing on another planet, 1970), Magellan (NASA radar mapper), Venus Express (ESA), Akatsuki (JAXA); planned: VERITAS, DAVINCI, EnVision',
      significance: 'A natural laboratory for runaway greenhouse warming and how Earth-sized planets can evolve very differently.',
      facts: [
        'A day on Venus (243 Earth days) is longer than its year (225 Earth days).',
        'Venus spins backwards compared with most planets, so the Sun rises in the west there.',
        'Its upper atmosphere races around the planet in about 4 Earth days ("super-rotation").'
      ]
    },
    quiz: [
      { q: 'Why is Venus the hottest planet?', options: ['It is closest to the Sun', 'Its thick CO₂ atmosphere traps heat', 'It has active lava oceans', 'It has no atmosphere'], answer: 1, explain: 'A runaway greenhouse effect keeps the surface at about 464 °C.' },
      { q: 'Which is longer on Venus?', options: ['Its day', 'Its year', 'They are equal', 'Neither — Venus doesn\'t rotate'], answer: 0, explain: 'One rotation takes 243 Earth days, its orbit 225 days.' },
      { q: 'Which mission made the first landing on another planet?', options: ['Viking 1', 'Venera 7', 'Mariner 2', 'Magellan'], answer: 1, explain: 'The Soviet Venera 7 transmitted from Venus\'s surface in December 1970.' }
    ]
  },
  {
    id: 'earth', name: 'Earth', type: 'planet', classification: 'Terrestrial planet',
    vis: { radius: 0.78, dist: 40.5, tex: 'earth', tilt: 23.44 },
    orbit: { au: 1.0, periodDays: 365.256, L0: 100.46 },
    rotationHours: 23.934,
    distanceFromEarth: 'You are here!',
    discovery: 'Our home. Its roundness was measured by Eratosthenes around 240 BCE.',
    data: {
      distance: '149.6 million km (1 AU)',
      orbitalPeriod: '365.25 days',
      rotationPeriod: '23 h 56 min (sidereal day)',
      diameter: '12,756 km',
      mass: '5.97 × 10²⁴ kg',
      temperature: 'Average about 15 °C (from about −89 °C to 57 °C recorded extremes)',
      atmosphere: '78% nitrogen, 21% oxygen, 0.9% argon, plus water vapour and ≈0.04% CO₂',
      moons: '1 (the Moon)',
      missions: 'Thousands of Earth-observation satellites: Landsat, Terra/Aqua, Sentinel (Copernicus), GOES; plus the International Space Station',
      significance: 'The only place known to host life, with liquid water oceans covering about 71% of its surface.',
      facts: [
        'Earth is the densest planet in the solar system.',
        'Its magnetic field deflects the solar wind and creates auroras near the poles.',
        'Earth is the only planet not named after a Greek or Roman deity.'
      ]
    },
    quiz: [
      { q: 'About how much of Earth\'s surface is covered by water?', options: ['31%', '51%', '71%', '91%'], answer: 2, explain: 'Oceans cover roughly 71% of Earth\'s surface.' },
      { q: 'Which gas makes up most of Earth\'s atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], answer: 1, explain: 'Nitrogen is ≈78%; oxygen ≈21%.' },
      { q: 'What causes Earth\'s seasons?', options: ['Changing distance from the Sun', 'The tilt of Earth\'s axis (≈23.4°)', 'The Moon\'s gravity', 'Solar flares'], answer: 1, explain: 'The axial tilt changes how directly sunlight strikes each hemisphere through the year.' }
    ]
  },
  {
    id: 'moon', name: 'Moon', type: 'moon', parent: 'earth', classification: 'Natural satellite of Earth',
    vis: { radius: 0.24, dist: 2.0, tex: 'moon', tilt: 6.7 },
    orbit: { parentKm: 384400, periodDays: 27.32 },
    rotationHours: 655.7,
    distanceFromEarth: '384,400 km on average (≈1.3 light-seconds)',
    discovery: 'Known since prehistory. Galileo first studied it with a telescope in 1609.',
    data: {
      distance: '384,400 km from Earth (orbits the Sun with Earth at 1 AU)',
      orbitalPeriod: '27.3 days around Earth (29.5 days from new moon to new moon)',
      rotationPeriod: '27.3 days — tidally locked, so the same side always faces Earth',
      diameter: '3,475 km (about 27% of Earth)',
      mass: '7.35 × 10²² kg (1.2% of Earth)',
      temperature: 'About 127 °C in daylight to −173 °C at night; polar craters below −240 °C',
      atmosphere: 'Extremely thin exosphere (helium, argon, neon, sodium, potassium)',
      moons: '—',
      missions: 'Luna 2 & 9, Apollo 11–17, Lunar Reconnaissance Orbiter, Chandrayaan-1/2/3, Chang\'e 1–6, Artemis I',
      significance: 'Probably formed from debris after a Mars-sized body hit the early Earth; it stabilises Earth\'s axial tilt and drives ocean tides.',
      facts: [
        'Twelve astronauts walked on the Moon between 1969 and 1972.',
        'The Moon drifts about 3.8 cm farther from Earth every year.',
        'Chang\'e 4 made the first soft landing on the far side in 2019.'
      ]
    },
    quiz: [
      { q: 'Why do we always see the same side of the Moon?', options: ['The Moon doesn\'t rotate', 'It is tidally locked: it rotates once per orbit', 'Earth blocks the other side', 'The far side is always dark'], answer: 1, explain: 'Its rotation period equals its orbital period (27.3 days).' },
      { q: 'How many people have walked on the Moon?', options: ['2', '6', '12', '24'], answer: 2, explain: 'Twelve astronauts on six Apollo landings (1969–1972).' }
    ]
  },
  {
    id: 'mars', name: 'Mars', type: 'planet', classification: 'Terrestrial planet',
    vis: { radius: 0.56, dist: 47, tex: 'mars', tilt: 25.19 },
    orbit: { au: 1.524, periodDays: 686.98, L0: 355.45 },
    rotationHours: 24.623,
    distanceFromEarth: '55 million – 401 million km',
    discovery: 'Known since antiquity; its red colour linked it to gods of war.',
    data: {
      distance: '227.9 million km (1.52 AU)',
      orbitalPeriod: '687 Earth days',
      rotationPeriod: '24 h 37 min (a "sol")',
      diameter: '6,792 km (about half of Earth)',
      mass: '6.42 × 10²³ kg (0.107 × Earth)',
      temperature: 'Average about −65 °C (from about −140 °C to 20 °C)',
      atmosphere: '95% carbon dioxide, 2.8% nitrogen, 2% argon; surface pressure under 1% of Earth\'s',
      moons: '2 (Phobos and Deimos)',
      missions: 'Viking 1 & 2, Mars Pathfinder, Spirit & Opportunity, Curiosity, Perseverance + Ingenuity, Mangalyaan (ISRO), Tianwen-1 + Zhurong (CNSA), MAVEN, Hope (UAE)',
      significance: 'Ancient river valleys and lake beds show Mars once had liquid water — making it a prime place to search for past life.',
      facts: [
        'Olympus Mons is about 22 km high — nearly 2.5 times the height of Mount Everest.',
        'Valles Marineris canyon stretches about 4,000 km.',
        'Mars is red because iron minerals in its dust have oxidised (rusted).'
      ]
    },
    quiz: [
      { q: 'Why does Mars look red?', options: ['It is very hot', 'Iron oxide (rust) in its dust', 'Red plants', 'Reflected light from Jupiter'], answer: 1, explain: 'Oxidised iron minerals coat the surface and fill the dusty air.' },
      { q: 'What is Olympus Mons?', options: ['A Martian moon', 'The largest volcano in the solar system', 'A crater lake', 'A NASA rover'], answer: 1, explain: 'It rises about 22 km above the surrounding plains.' },
      { q: 'What are Mars\'s two moons called?', options: ['Io and Europa', 'Phobos and Deimos', 'Titan and Rhea', 'Triton and Nereid'], answer: 1, explain: 'Both were discovered by Asaph Hall in 1877.' }
    ]
  },
  {
    id: 'phobos', name: 'Phobos', type: 'moon', parent: 'mars', classification: 'Natural satellite of Mars',
    vis: { radius: 0.12, dist: 1.1, tex: 'phobos', tilt: 0 },
    orbit: { parentKm: 9376, periodDays: 0.319 },
    rotationHours: 7.65,
    distanceFromEarth: 'Same as Mars: 55 million – 401 million km',
    discovery: 'Discovered by Asaph Hall at the US Naval Observatory, 18 August 1877.',
    data: {
      distance: '9,376 km from Mars\'s centre (only ≈6,000 km above the surface)',
      orbitalPeriod: '7 h 39 min — faster than Mars rotates, so it rises in the west',
      rotationPeriod: '7 h 39 min (tidally locked)',
      diameter: 'About 22.5 km (irregular: 27 × 22 × 18 km)',
      mass: '1.07 × 10¹⁶ kg',
      temperature: 'About −4 °C on the sunlit side to −112 °C on the dark side',
      atmosphere: 'None',
      moons: '—',
      missions: 'Mariner 9, Viking, Mars Express (close flybys); JAXA\'s Martian Moons eXploration (MMX) plans a sample return',
      significance: 'It may be a captured asteroid or debris from an ancient impact on Mars — MMX samples aim to settle this.',
      facts: [
        'Phobos is spiralling inward about 1.8 m per century and should break apart or crash in ~30–50 million years.',
        'Its biggest crater, Stickney, is about 9 km wide.'
      ]
    },
    quiz: [
      { q: 'What will eventually happen to Phobos?', options: ['It will escape into space', 'It will spiral in and break up or crash into Mars', 'It will become a planet', 'Nothing will change'], answer: 1, explain: 'Tidal forces shrink its orbit; in tens of millions of years it will break apart.' },
      { q: 'Who discovered Phobos?', options: ['Galileo', 'Asaph Hall', 'Carl Sagan', 'Christiaan Huygens'], answer: 1, explain: 'Asaph Hall found both Martian moons in August 1877.' }
    ]
  },
  {
    id: 'ceres', name: 'Ceres', type: 'dwarf', classification: 'Dwarf planet (largest object in the asteroid belt)',
    vis: { radius: 0.26, dist: 60, tex: 'ceres', tilt: 4 },
    orbit: { au: 2.77, periodDays: 1681.6, L0: 153.0 },
    rotationHours: 9.07,
    distanceFromEarth: 'About 250 million – 440 million km',
    discovery: 'Discovered by Giuseppe Piazzi on 1 January 1801 — first asteroid found.',
    data: {
      distance: '413.7 million km (2.77 AU)',
      orbitalPeriod: '4.6 Earth years',
      rotationPeriod: '9 h 4 min',
      diameter: 'About 940 km',
      mass: '9.38 × 10²⁰ kg (about 1/3 of the asteroid belt\'s mass)',
      temperature: 'About −105 °C average',
      atmosphere: 'Possible transient water-vapour exosphere',
      moons: '0',
      missions: 'Dawn (NASA, orbited 2015–2018)',
      significance: 'Bright salt deposits in Occator Crater point to briny liquid below the surface — Ceres may be an "ocean world" relic.',
      facts: [
        'Ceres was called a planet for about 50 years after its discovery.',
        'Dawn was the first spacecraft to orbit two different worlds beyond Earth (Vesta and Ceres).'
      ]
    },
    quiz: [
      { q: 'Where is Ceres located?', options: ['Kuiper Belt', 'Asteroid belt between Mars and Jupiter', 'Orbiting Saturn', 'Oort Cloud'], answer: 1, explain: 'It is the largest object in the main asteroid belt.' },
      { q: 'Which spacecraft orbited Ceres?', options: ['Dawn', 'Juno', 'Rosetta', 'Galileo'], answer: 0, explain: 'NASA\'s Dawn orbited Vesta (2011–12) and then Ceres (2015–18).' }
    ]
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet', classification: 'Gas giant',
    vis: { radius: 2.4, dist: 78, tex: 'jupiter', tilt: 3.13 },
    orbit: { au: 5.203, periodDays: 4332.6, L0: 34.40 },
    rotationHours: 9.925,
    distanceFromEarth: '588 million – 968 million km',
    discovery: 'Known since antiquity. Galileo discovered its four largest moons in January 1610.',
    data: {
      distance: '778.5 million km (5.2 AU)',
      orbitalPeriod: '11.86 Earth years',
      rotationPeriod: '9 h 56 min (fastest-spinning planet)',
      diameter: '142,984 km at the equator (11 × Earth)',
      mass: '1.90 × 10²⁷ kg (318 × Earth; 2.5 × all other planets combined)',
      temperature: 'About −110 °C at the 1-bar cloud level',
      atmosphere: '≈90% hydrogen, ≈10% helium, with ammonia, methane and water clouds',
      moons: '97 known (as of 2025), including Io, Europa, Ganymede and Callisto',
      missions: 'Pioneer 10 & 11, Voyager 1 & 2, Galileo (orbiter + atmospheric probe), Juno (orbiting since 2016), Juice (ESA, en route), Europa Clipper (NASA, en route)',
      significance: 'Its gravity shaped the early solar system and the asteroid belt; its moons may hide some of the largest oceans anywhere.',
      facts: [
        'The Great Red Spot is a storm larger than Earth that has been observed since at least the 1830s.',
        'Jupiter has faint rings, discovered by Voyager 1 in 1979.',
        'More than 1,300 Earths could fit inside Jupiter.'
      ]
    },
    quiz: [
      { q: 'What is the Great Red Spot?', options: ['A volcano', 'A giant long-lived storm', 'A crater', 'A moon\'s shadow'], answer: 1, explain: 'An anticyclone wider than Earth, observed for at least ~190 years.' },
      { q: 'What is Jupiter mostly made of?', options: ['Rock and iron', 'Water ice', 'Hydrogen and helium', 'Carbon dioxide'], answer: 2, explain: 'Like the Sun, Jupiter is dominated by hydrogen and helium.' },
      { q: 'Which spacecraft has been orbiting Jupiter since 2016?', options: ['Cassini', 'Juno', 'New Horizons', 'Voyager 2'], answer: 1, explain: 'NASA\'s Juno arrived on 4 July 2016.' }
    ]
  },
  {
    id: 'io', name: 'Io', type: 'moon', parent: 'jupiter', classification: 'Galilean moon of Jupiter',
    vis: { radius: 0.2, dist: 3.4, tex: 'io', tilt: 0 },
    orbit: { parentKm: 421700, periodDays: 1.769 },
    rotationHours: 42.46,
    distanceFromEarth: 'Same as Jupiter: 588 – 968 million km',
    discovery: 'Discovered by Galileo Galilei in January 1610.',
    data: {
      distance: '421,700 km from Jupiter',
      orbitalPeriod: '1.77 days',
      rotationPeriod: '1.77 days (tidally locked)',
      diameter: '3,643 km',
      mass: '8.93 × 10²² kg',
      temperature: 'About −143 °C at the surface; lava up to ≈1,600 °C',
      atmosphere: 'Very thin, mostly sulfur dioxide from volcanoes',
      moons: '—',
      missions: 'Voyager 1 (discovered active volcanoes, 1979), Galileo, Juno close flybys (2023–24)',
      significance: 'The most volcanically active body known, heated by tidal flexing from Jupiter and its neighbouring moons.',
      facts: ['Io has more than 400 active volcanoes.', 'Some volcanic plumes rise over 300 km above the surface.']
    },
    quiz: [
      { q: 'What heats Io\'s interior?', options: ['Radioactive uranium only', 'Tidal flexing from Jupiter\'s gravity', 'Sunlight', 'Its own nuclear fusion'], answer: 1, explain: 'Orbital resonance with Europa and Ganymede keeps Io\'s orbit elliptical, so tides constantly squeeze it.' },
      { q: 'Io is famous for having…', options: ['A global ocean on the surface', 'Hundreds of active volcanoes', 'Rings', 'The thickest atmosphere of any moon'], answer: 1, explain: 'It is the most volcanically active world in the solar system.' }
    ]
  },
  {
    id: 'europa', name: 'Europa', type: 'moon', parent: 'jupiter', classification: 'Galilean moon of Jupiter (ocean world)',
    vis: { radius: 0.18, dist: 4.1, tex: 'europa', tilt: 0 },
    orbit: { parentKm: 671100, periodDays: 3.551 },
    rotationHours: 85.2,
    distanceFromEarth: 'Same as Jupiter: 588 – 968 million km',
    discovery: 'Discovered by Galileo Galilei in January 1610.',
    data: {
      distance: '671,100 km from Jupiter',
      orbitalPeriod: '3.55 days',
      rotationPeriod: '3.55 days (tidally locked)',
      diameter: '3,122 km (slightly smaller than our Moon)',
      mass: '4.80 × 10²² kg',
      temperature: 'About −160 °C at the equator',
      atmosphere: 'Extremely thin, mostly oxygen',
      moons: '—',
      missions: 'Voyager, Galileo, Juno flyby (2022); Europa Clipper (NASA, arrives 2030); Juice (ESA) flybys',
      significance: 'Beneath an ice shell perhaps 15–25 km thick lies a salty ocean that may contain twice as much water as all of Earth\'s oceans.',
      facts: ['Europa\'s surface is one of the smoothest in the solar system.', 'Hubble and Keck observations hint at plumes of water vapour.']
    },
    quiz: [
      { q: 'Why is Europa a top target in the search for life?', options: ['It has forests', 'It likely has a liquid salty ocean under its ice', 'It is the hottest moon', 'It has an oxygen-rich thick atmosphere'], answer: 1, explain: 'Liquid water, chemistry and energy are key ingredients for life.' },
      { q: 'Which NASA mission launched in 2024 to study Europa?', options: ['Europa Clipper', 'Dragonfly', 'Psyche', 'Lucy'], answer: 0, explain: 'Europa Clipper launched on 14 October 2024 and will perform dozens of flybys.' }
    ]
  },
  {
    id: 'ganymede', name: 'Ganymede', type: 'moon', parent: 'jupiter', classification: 'Galilean moon of Jupiter (largest moon)',
    vis: { radius: 0.27, dist: 4.9, tex: 'ganymede', tilt: 0 },
    orbit: { parentKm: 1070400, periodDays: 7.155 },
    rotationHours: 171.7,
    distanceFromEarth: 'Same as Jupiter: 588 – 968 million km',
    discovery: 'Discovered by Galileo Galilei in January 1610.',
    data: {
      distance: '1,070,400 km from Jupiter',
      orbitalPeriod: '7.15 days',
      rotationPeriod: '7.15 days (tidally locked)',
      diameter: '5,268 km (larger than Mercury)',
      mass: '1.48 × 10²³ kg',
      temperature: 'About −163 °C average',
      atmosphere: 'Very thin oxygen exosphere',
      moons: '—',
      missions: 'Voyager, Galileo, Juno flyby (2021); Juice will orbit Ganymede from 2034',
      significance: 'The only moon known to generate its own magnetic field; likely has a deep internal ocean.',
      facts: ['Ganymede is the largest moon in the solar system.', 'Juice will be the first spacecraft to orbit a moon other than Earth\'s.']
    },
    quiz: [
      { q: 'What makes Ganymede unique among moons?', options: ['It has rings', 'It has its own magnetic field', 'It orbits backwards', 'It has volcanoes of lava'], answer: 1, explain: 'Ganymede has an intrinsic magnetic field, likely from a liquid iron core.' },
      { q: 'Ganymede is larger than which planet?', options: ['Earth', 'Mars', 'Mercury', 'Venus'], answer: 2, explain: 'At 5,268 km it is wider than Mercury (4,879 km), though less massive.' }
    ]
  },
  {
    id: 'callisto', name: 'Callisto', type: 'moon', parent: 'jupiter', classification: 'Galilean moon of Jupiter',
    vis: { radius: 0.25, dist: 5.8, tex: 'callisto', tilt: 0 },
    orbit: { parentKm: 1882700, periodDays: 16.689 },
    rotationHours: 400.5,
    distanceFromEarth: 'Same as Jupiter: 588 – 968 million km',
    discovery: 'Discovered by Galileo Galilei in January 1610.',
    data: {
      distance: '1,882,700 km from Jupiter',
      orbitalPeriod: '16.7 days',
      rotationPeriod: '16.7 days (tidally locked)',
      diameter: '4,821 km',
      mass: '1.08 × 10²³ kg',
      temperature: 'About −139 °C average',
      atmosphere: 'Very thin carbon dioxide and oxygen',
      moons: '—',
      missions: 'Voyager, Galileo; Juice flybys planned',
      significance: 'One of the most heavily cratered surfaces known — a nearly untouched record of 4 billion years of impacts.',
      facts: ['Callisto lies outside Jupiter\'s most intense radiation belts.', 'Valhalla, its largest impact basin, spans about 3,800 km including its rings.']
    },
    quiz: [
      { q: 'Callisto\'s surface is best described as…', options: ['Covered in active volcanoes', 'Extremely heavily cratered', 'Covered in liquid oceans', 'Mostly sand dunes'], answer: 1, explain: 'Little geological activity has erased its ancient craters.' },
      { q: 'Callisto is one of the four…', options: ['Galilean moons', 'Trojan asteroids', 'Kuiper Belt objects', 'Martian moons'], answer: 0, explain: 'Io, Europa, Ganymede and Callisto were found by Galileo in 1610.' }
    ]
  },
  {
    id: 'saturn', name: 'Saturn', type: 'planet', classification: 'Gas giant',
    vis: { radius: 2.0, dist: 102, tex: 'saturn', tilt: 26.73 },
    orbit: { au: 9.537, periodDays: 10759.2, L0: 49.94 },
    rotationHours: 10.656,
    distanceFromEarth: '1.2 billion – 1.7 billion km',
    discovery: 'Known since antiquity. Galileo saw its rings in 1610; Christiaan Huygens explained them in 1659.',
    data: {
      distance: '1.43 billion km (9.5 AU)',
      orbitalPeriod: '29.4 Earth years',
      rotationPeriod: '10 h 39 min',
      diameter: '120,536 km at the equator (9.4 × Earth)',
      mass: '5.68 × 10²⁶ kg (95 × Earth)',
      temperature: 'About −140 °C at the 1-bar level',
      atmosphere: '≈96% hydrogen, ≈3% helium, with methane and ammonia',
      moons: '274 known (as of 2025), including Titan and Enceladus',
      missions: 'Pioneer 11, Voyager 1 & 2, Cassini-Huygens (orbited 2004–2017); Dragonfly to Titan (planned launch 2028)',
      significance: 'Its rings and moons are a laboratory for how disks of material — like those that formed planets — behave.',
      facts: [
        'Saturn\'s average density is lower than water.',
        'The main rings are about 280,000 km wide but mostly only about 10 m to 1 km thick.',
        'A six-sided jet-stream pattern (the "hexagon") circles its north pole.'
      ]
    },
    quiz: [
      { q: 'What are Saturn\'s rings made of?', options: ['Solid rock sheets', 'Countless pieces of water ice and rock', 'Gas', 'Metal'], answer: 1, explain: 'Particles range from dust grains to house-sized chunks, mostly water ice.' },
      { q: 'Which mission orbited Saturn from 2004 to 2017?', options: ['Galileo', 'Cassini', 'Juno', 'Voyager 2'], answer: 1, explain: 'Cassini (with ESA\'s Huygens probe) ended with a plunge into Saturn in 2017.' },
      { q: 'Saturn\'s average density is…', options: ['Higher than iron', 'Equal to Earth\'s', 'Lower than water', 'Higher than lead'], answer: 2, explain: 'About 0.69 g/cm³ — less than water\'s 1 g/cm³.' }
    ]
  },
  {
    id: 'titan', name: 'Titan', type: 'moon', parent: 'saturn', classification: 'Largest moon of Saturn',
    vis: { radius: 0.27, dist: 5.4, tex: 'titan', tilt: 0 },
    orbit: { parentKm: 1221870, periodDays: 15.945 },
    rotationHours: 382.7,
    distanceFromEarth: 'Same as Saturn: 1.2 – 1.7 billion km',
    discovery: 'Discovered by Christiaan Huygens on 25 March 1655.',
    data: {
      distance: '1,221,870 km from Saturn',
      orbitalPeriod: '15.9 days',
      rotationPeriod: '15.9 days (tidally locked)',
      diameter: '5,150 km (second-largest moon)',
      mass: '1.35 × 10²³ kg',
      temperature: 'About −179 °C at the surface',
      atmosphere: 'Thick: ≈95% nitrogen and ≈5% methane; surface pressure ≈1.5 × Earth',
      moons: '—',
      missions: 'Voyager 1, Cassini; Huygens probe landed 14 January 2005; Dragonfly rotorcraft planned',
      significance: 'The only moon with a thick atmosphere and the only other world known with stable surface liquids — lakes and seas of liquid methane and ethane.',
      facts: ['Huygens\' landing is the most distant landing ever made.', 'Titan has a methane "water cycle" with clouds, rain and rivers.']
    },
    quiz: [
      { q: 'What fills Titan\'s lakes and seas?', options: ['Liquid water', 'Liquid methane and ethane', 'Lava', 'Liquid nitrogen only'], answer: 1, explain: 'At −179 °C, methane and ethane are liquid.' },
      { q: 'Which probe landed on Titan in 2005?', options: ['Philae', 'Huygens', 'Venera', 'Beagle 2'], answer: 1, explain: 'ESA\'s Huygens rode with Cassini and landed on 14 January 2005.' }
    ]
  },
  {
    id: 'enceladus', name: 'Enceladus', type: 'moon', parent: 'saturn', classification: 'Moon of Saturn (ocean world)',
    vis: { radius: 0.13, dist: 3.9, tex: 'enceladus', tilt: 0 },
    orbit: { parentKm: 238040, periodDays: 1.370 },
    rotationHours: 32.9,
    distanceFromEarth: 'Same as Saturn: 1.2 – 1.7 billion km',
    discovery: 'Discovered by William Herschel on 28 August 1789.',
    data: {
      distance: '238,040 km from Saturn',
      orbitalPeriod: '1.37 days',
      rotationPeriod: '1.37 days (tidally locked)',
      diameter: '504 km',
      mass: '1.08 × 10²⁰ kg',
      temperature: 'About −201 °C',
      atmosphere: 'Water-vapour plumes from its south pole',
      moons: '—',
      missions: 'Voyager, Cassini (flew through its plumes)',
      significance: 'Cassini found salty water jets containing silica, organics and phosphorus from a global ocean — key ingredients for habitability.',
      facts: ['Enceladus reflects about 99% of the sunlight that hits it — one of the brightest objects in the solar system.', 'Its plumes feed Saturn\'s E ring.']
    },
    quiz: [
      { q: 'What did Cassini discover shooting from Enceladus\'s south pole?', options: ['Lava fountains', 'Plumes of water vapour and ice', 'Radio signals', 'Dust storms'], answer: 1, explain: 'Jets from "tiger stripe" fractures vent its subsurface ocean into space.' },
      { q: 'Enceladus\'s plumes supply material to…', options: ['Saturn\'s E ring', 'Jupiter\'s Great Red Spot', 'The asteroid belt', 'Titan\'s lakes'], answer: 0, explain: 'Ice particles from the plumes spread out to form the E ring.' }
    ]
  },
  {
    id: 'uranus', name: 'Uranus', type: 'planet', classification: 'Ice giant',
    vis: { radius: 1.35, dist: 141, tex: 'uranus', tilt: 97.77 },
    orbit: { au: 19.19, periodDays: 30688.5, L0: 313.23 },
    rotationHours: -17.24,
    distanceFromEarth: '2.6 billion – 3.2 billion km',
    discovery: 'Discovered by William Herschel on 13 March 1781 — the first planet found with a telescope.',
    data: {
      distance: '2.87 billion km (19.2 AU)',
      orbitalPeriod: '84 Earth years',
      rotationPeriod: '17 h 14 min, retrograde',
      diameter: '51,118 km (4 × Earth)',
      mass: '8.68 × 10²⁵ kg (14.5 × Earth)',
      temperature: 'About −195 °C (coldest planetary atmosphere measured: ≈−224 °C)',
      atmosphere: 'Hydrogen and helium with ≈2% methane (which gives the blue-green colour)',
      moons: '29 known (as of 2025), including Titania, Oberon, Miranda; 13 known rings',
      missions: 'Voyager 2 (the only flyby, January 1986); a Uranus Orbiter and Probe is a top NASA priority',
      significance: 'Its extreme tilt suggests a giant collision long ago; ice giants like it may be the most common planet size in the galaxy.',
      facts: ['Uranus rolls around the Sun on its side, tilted about 98°.', 'Each pole gets about 42 years of continuous sunlight, then 42 years of darkness.']
    },
    quiz: [
      { q: 'What is unusual about Uranus\'s rotation?', options: ['It doesn\'t rotate', 'It is tilted about 98° — it spins on its side', 'It rotates once a year', 'It has two axes'], answer: 1, explain: 'A huge ancient impact may have knocked it over.' },
      { q: 'Which spacecraft is the only one to visit Uranus?', options: ['Voyager 1', 'Voyager 2', 'Cassini', 'New Horizons'], answer: 1, explain: 'Voyager 2 flew past in January 1986.' },
      { q: 'What gives Uranus its blue-green colour?', options: ['Oceans', 'Methane absorbing red light', 'Copper', 'Ice reflection of Neptune'], answer: 1, explain: 'Methane absorbs red wavelengths, so blue-green light is reflected.' }
    ]
  },
  {
    id: 'neptune', name: 'Neptune', type: 'planet', classification: 'Ice giant',
    vis: { radius: 1.3, dist: 175, tex: 'neptune', tilt: 28.32 },
    orbit: { au: 30.07, periodDays: 60195, L0: 304.88 },
    rotationHours: 16.11,
    distanceFromEarth: '4.3 billion – 4.7 billion km',
    discovery: 'Predicted mathematically by Urbain Le Verrier (and John Couch Adams); observed by Johann Galle on 23 September 1846.',
    data: {
      distance: '4.5 billion km (30.1 AU)',
      orbitalPeriod: '164.8 Earth years',
      rotationPeriod: '16 h 6 min',
      diameter: '49,528 km (3.9 × Earth)',
      mass: '1.02 × 10²⁶ kg (17 × Earth)',
      temperature: 'About −200 °C at the 1-bar level',
      atmosphere: 'Hydrogen, helium and methane',
      moons: '16 known, including Triton',
      missions: 'Voyager 2 (the only flyby, August 1989)',
      significance: 'The first planet found by mathematical prediction rather than observation — a triumph of Newtonian gravity.',
      facts: ['Neptune has the fastest winds measured in the solar system — over 2,000 km/h.', 'It completed its first full orbit since discovery in 2011.']
    },
    quiz: [
      { q: 'How was Neptune discovered?', options: ['By accident while viewing the Moon', 'Predicted by maths, then observed', 'By Voyager 2', 'It was known since antiquity'], answer: 1, explain: 'Irregularities in Uranus\'s orbit led Le Verrier to predict Neptune\'s position.' },
      { q: 'Neptune holds the record for…', options: ['The fastest winds in the solar system', 'The most moons', 'The hottest surface', 'The shortest year'], answer: 0, explain: 'Winds exceed 2,000 km/h.' },
      { q: 'How long is one Neptune year?', options: ['12 Earth years', '84 Earth years', 'About 165 Earth years', '248 Earth years'], answer: 2, explain: 'Neptune orbits the Sun once every 164.8 years.' }
    ]
  },
  {
    id: 'triton', name: 'Triton', type: 'moon', parent: 'neptune', classification: 'Largest moon of Neptune',
    vis: { radius: 0.2, dist: 2.7, tex: 'triton', tilt: 0 },
    orbit: { parentKm: 354760, periodDays: -5.877 },
    rotationHours: 141.0,
    distanceFromEarth: 'Same as Neptune: 4.3 – 4.7 billion km',
    discovery: 'Discovered by William Lassell on 10 October 1846, 17 days after Neptune.',
    data: {
      distance: '354,760 km from Neptune',
      orbitalPeriod: '5.88 days, retrograde (backwards)',
      rotationPeriod: '5.88 days (tidally locked)',
      diameter: '2,707 km',
      mass: '2.14 × 10²² kg',
      temperature: 'About −235 °C — one of the coldest surfaces measured',
      atmosphere: 'Thin nitrogen with traces of methane',
      moons: '—',
      missions: 'Voyager 2 (1989)',
      significance: 'Its backwards orbit shows it was probably a Kuiper Belt object captured by Neptune.',
      facts: ['Voyager 2 saw nitrogen geysers erupting about 8 km high.', 'Triton is slowly spiralling inward toward Neptune.']
    },
    quiz: [
      { q: 'Why do scientists think Triton was captured?', options: ['It is made of gold', 'It orbits Neptune backwards (retrograde)', 'It is larger than Neptune', 'It glows'], answer: 1, explain: 'Large moons formed with their planet orbit in the same direction it spins.' },
      { q: 'What did Voyager 2 see erupting on Triton?', options: ['Lava volcanoes', 'Nitrogen geysers', 'Water oceans', 'Dust devils on Mars'], answer: 1, explain: 'Dark plumes rose about 8 km into its thin atmosphere.' }
    ]
  },
  {
    id: 'pluto', name: 'Pluto', type: 'dwarf', classification: 'Dwarf planet (Kuiper Belt object)',
    vis: { radius: 0.28, dist: 198, tex: 'pluto', tilt: 122.5 },
    orbit: { au: 39.48, periodDays: 90560, L0: 238.93 },
    rotationHours: -153.29,
    distanceFromEarth: 'About 4.3 billion – 7.5 billion km',
    discovery: 'Discovered by Clyde Tombaugh at Lowell Observatory on 18 February 1930.',
    data: {
      distance: '5.9 billion km on average (39.5 AU; ranges 29.7–49.3 AU)',
      orbitalPeriod: '248 Earth years',
      rotationPeriod: '6.4 Earth days, retrograde',
      diameter: '2,377 km (smaller than our Moon)',
      mass: '1.30 × 10²² kg (0.2% of Earth)',
      temperature: 'About −225 °C',
      atmosphere: 'Thin nitrogen, methane and carbon monoxide with layered blue haze',
      moons: '5 (Charon, Nix, Hydra, Kerberos, Styx)',
      missions: 'New Horizons (NASA flyby, 14 July 2015)',
      significance: 'Reclassified as a dwarf planet by the IAU in 2006; New Horizons revealed surprising active geology, glaciers of nitrogen ice and mountains of water ice.',
      facts: ['Pluto\'s heart-shaped Tombaugh Regio contains a nitrogen-ice plain called Sputnik Planitia.', 'Some of Clyde Tombaugh\'s ashes travel aboard New Horizons.']
    },
    quiz: [
      { q: 'When was Pluto reclassified as a dwarf planet?', options: ['1930', '1989', '2006', '2015'], answer: 2, explain: 'The IAU defined "planet" in August 2006; Pluto hadn\'t cleared its orbital neighbourhood.' },
      { q: 'What famous feature did New Horizons photograph on Pluto?', options: ['A giant red spot', 'A heart-shaped region', 'A ring system', 'A Moon-sized crater'], answer: 1, explain: 'Tombaugh Regio, named after Pluto\'s discoverer.' }
    ]
  },
  {
    id: 'charon', name: 'Charon', type: 'moon', parent: 'pluto', classification: 'Largest moon of Pluto',
    vis: { radius: 0.15, dist: 0.9, tex: 'charon', tilt: 0 },
    orbit: { parentKm: 19591, periodDays: -6.387 },
    rotationHours: 153.3,
    distanceFromEarth: 'Same as Pluto: 4.3 – 7.5 billion km',
    discovery: 'Discovered by James Christy at the US Naval Observatory on 22 June 1978.',
    data: {
      distance: '19,591 km from Pluto',
      orbitalPeriod: '6.39 days',
      rotationPeriod: '6.39 days — Pluto and Charon are mutually tidally locked',
      diameter: '1,212 km (about half of Pluto)',
      mass: '1.59 × 10²¹ kg',
      temperature: 'About −220 °C',
      atmosphere: 'None detected',
      moons: '—',
      missions: 'New Horizons (2015)',
      significance: 'So large relative to Pluto that the pair orbit a point between them — often called a double (binary) system.',
      facts: ['Charon\'s north pole has a reddish cap nicknamed Mordor Macula.', 'From Pluto, Charon never moves across the sky — it hangs over one hemisphere.']
    },
    quiz: [
      { q: 'What is special about Pluto and Charon?', options: ['They collide every year', 'They are mutually tidally locked and orbit a point between them', 'Charon is larger than Pluto', 'Charon has rings'], answer: 1, explain: 'Their barycentre lies in the space between the two bodies.' },
      { q: 'Charon\'s reddish polar cap is nicknamed…', options: ['Mordor Macula', 'Red Spot', 'Tiger Stripes', 'Valhalla'], answer: 0, explain: 'Material escaping Pluto\'s atmosphere may coat and redden Charon\'s pole.' }
    ]
  }
];

export const BODY_MAP = Object.fromEntries(BODIES.map(b => [b.id, b]));

// True physical values for the Compare tool (km, AU).
export const TRUE_SCALE = {
  sun: { diameterKm: 1392700 },
  mercury: { diameterKm: 4879, au: 0.387 },
  venus: { diameterKm: 12104, au: 0.723 },
  earth: { diameterKm: 12756, au: 1.0 },
  mars: { diameterKm: 6792, au: 1.524 },
  ceres: { diameterKm: 940, au: 2.77 },
  jupiter: { diameterKm: 142984, au: 5.203 },
  saturn: { diameterKm: 120536, au: 9.537 },
  uranus: { diameterKm: 51118, au: 19.19 },
  neptune: { diameterKm: 49528, au: 30.07 },
  pluto: { diameterKm: 2377, au: 39.48 }
};
