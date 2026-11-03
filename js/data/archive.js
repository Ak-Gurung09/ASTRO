// ASTRO LAB — Space Mission Archive
// Sources: NASA, ESA, JAXA, ISRO, CNSA and SpaceX mission pages.
// Statuses reflect public information as of 2025; check agency sites for the latest.

export const ARCHIVE_STATUS_NOTE = 'Mission statuses reflect public agency information as of 2025.';

export const ARCHIVE = [
  {
    id: 'apollo', name: 'Apollo Program', agency: 'NASA', country: 'USA', launch: '1961–1972 (Apollo 11 launched 16 July 1969)',
    objective: 'Land humans on the Moon and return them safely to Earth.', target: 'Moon',
    spacecraft: 'Saturn V rocket (110 m tall), Command/Service Module and Lunar Module.',
    discoveries: ['382 kg of lunar rock and soil returned by six landings', 'Evidence the Moon formed from debris of a giant impact with early Earth', 'Retroreflectors still used to measure the Earth–Moon distance to millimetres'],
    status: 'Completed (Apollo 17 returned in December 1972)', statusKind: 'complete',
    timeline: [['1967', 'Apollo 1 fire claims three astronauts'], ['Dec 1968', 'Apollo 8 — first humans to orbit the Moon'], ['20 Jul 1969', 'Apollo 11 lands; Armstrong and Aldrin walk on the Moon'], ['Apr 1970', 'Apollo 13 survives an in-flight explosion'], ['Dec 1972', 'Apollo 17, the last crewed lunar landing']],
    facts: ['Twelve astronauts walked on the Moon.', 'The Apollo Guidance Computer had about 4 KB of RAM.'],
    quiz: [{ q: 'In what year did Apollo 11 land on the Moon?', options: ['1961', '1969', '1972', '1975'], answer: 1, explain: 'The Eagle lander touched down on 20 July 1969.' }]
  },
  {
    id: 'voyager1', name: 'Voyager 1', agency: 'NASA / JPL', country: 'USA', launch: '5 September 1977',
    objective: 'Fly past Jupiter and Saturn, then explore the outer heliosphere and interstellar space.', target: 'Jupiter, Saturn, interstellar space',
    spacecraft: '≈722 kg probe powered by radioisotope thermoelectric generators (RTGs), carrying the Golden Record.',
    discoveries: ['Active volcanoes on Io (1979)', 'Jupiter\'s faint ring', 'Crossed the heliopause into interstellar space in August 2012'],
    status: 'Operating with a reduced set of instruments; the most distant human-made object', statusKind: 'active',
    timeline: [['Sep 1977', 'Launch'], ['Mar 1979', 'Jupiter flyby'], ['Nov 1980', 'Saturn and Titan flyby'], ['Feb 1990', '"Pale Blue Dot" photo of Earth'], ['Aug 2012', 'Enters interstellar space']],
    facts: ['Its signals take over 22 hours to reach Earth.', 'The Golden Record carries sounds and images of Earth.'],
    quiz: [{ q: 'What did Voyager 1 cross in 2012?', options: ['The asteroid belt', 'The heliopause into interstellar space', 'Pluto\'s orbit', 'The Oort Cloud'], answer: 1, explain: 'It was the first spacecraft to reach interstellar space.' }]
  },
  {
    id: 'voyager2', name: 'Voyager 2', agency: 'NASA / JPL', country: 'USA', launch: '20 August 1977',
    objective: 'Grand Tour of the outer planets.', target: 'Jupiter, Saturn, Uranus, Neptune',
    spacecraft: 'Twin of Voyager 1, RTG powered, with its own Golden Record.',
    discoveries: ['10 new moons of Uranus and the planet\'s magnetic field', 'Neptune\'s Great Dark Spot', 'Nitrogen geysers on Triton'],
    status: 'Operating in interstellar space (since November 2018) with reduced instruments', statusKind: 'active',
    timeline: [['Aug 1977', 'Launch (16 days before Voyager 1)'], ['Jul 1979', 'Jupiter'], ['Aug 1981', 'Saturn'], ['Jan 1986', 'Uranus — only visit ever'], ['Aug 1989', 'Neptune — only visit ever'], ['Nov 2018', 'Enters interstellar space']],
    facts: ['It is the only spacecraft to have visited Uranus and Neptune.', 'A rare planetary alignment made its four-planet tour possible.'],
    quiz: [{ q: 'Which two planets has only Voyager 2 visited?', options: ['Mars and Venus', 'Uranus and Neptune', 'Jupiter and Saturn', 'Mercury and Pluto'], answer: 1, explain: 'It flew by Uranus in 1986 and Neptune in 1989.' }]
  },
  {
    id: 'hubble', name: 'Hubble Space Telescope', agency: 'NASA / ESA', country: 'International', launch: '24 April 1990 (Space Shuttle Discovery, STS-31)',
    objective: 'Observe the universe in visible, ultraviolet and near-infrared light from above the atmosphere.', target: 'Deep space',
    spacecraft: '2.4 m primary mirror; school-bus sized; serviced by astronauts five times (1993–2009).',
    discoveries: ['Helped pin down the universe\'s age (≈13.8 billion years)', 'Hubble Deep Field images of thousands of galaxies', 'Evidence that the expansion of the universe is accelerating (dark energy)'],
    status: 'Operating', statusKind: 'active',
    timeline: [['Apr 1990', 'Launch'], ['Dec 1993', 'Servicing Mission 1 corrects its flawed mirror'], ['Dec 1995', 'Hubble Deep Field'], ['May 2009', 'Final servicing mission']],
    facts: ['Hubble orbits about 540 km above Earth.', 'It has made well over 1.5 million observations.'],
    quiz: [{ q: 'What problem did the first servicing mission fix?', options: ['A broken antenna', 'A flaw in its primary mirror', 'Low fuel', 'A cracked solar panel'], answer: 1, explain: 'Corrective optics (COSTAR) and a new camera fixed the blurry images in 1993.' }]
  },
  {
    id: 'iss', name: 'International Space Station', agency: 'NASA, Roscosmos, ESA, JAXA, CSA', country: 'International', launch: '20 November 1998 (first module, Zarya)',
    objective: 'A permanently crewed orbiting laboratory for science, technology and international cooperation.', target: 'Low Earth orbit (≈400 km)',
    spacecraft: 'About 109 m across (a football field), ≈420,000 kg; orbits Earth every ≈92 minutes.',
    discoveries: ['Long-duration effects of weightlessness on the human body', 'Thousands of experiments in biology, materials and physics', 'Technology for future deep-space missions'],
    status: 'Operating; planned to be retired around 2030', statusKind: 'active',
    timeline: [['Nov 1998', 'Zarya launches'], ['2 Nov 2000', 'Expedition 1 — continuously crewed ever since'], ['2011', 'Main assembly completed'], ['2020', 'First commercial crew (SpaceX Demo-2) arrives']],
    facts: ['Crews see about 16 sunrises and sunsets every day.', 'The station travels at about 28,000 km/h.'],
    quiz: [{ q: 'About how long does the ISS take to orbit Earth?', options: ['24 hours', '92 minutes', '7 days', '12 hours'], answer: 1, explain: 'At ≈28,000 km/h it circles Earth about 16 times a day.' }]
  },
  {
    id: 'cassini', name: 'Cassini–Huygens', agency: 'NASA / ESA / ASI', country: 'International', launch: '15 October 1997',
    objective: 'Study Saturn, its rings and moons; land the Huygens probe on Titan.', target: 'Saturn & Titan',
    spacecraft: 'Cassini orbiter (≈5,600 kg with fuel) plus ESA\'s Huygens lander.',
    discoveries: ['Water plumes erupting from Enceladus', 'Lakes and seas of liquid methane on Titan', 'Huygens landed on Titan on 14 January 2005'],
    status: 'Completed — ended with a deliberate plunge into Saturn on 15 September 2017', statusKind: 'complete',
    timeline: [['Oct 1997', 'Launch'], ['Jul 2004', 'Enters Saturn orbit'], ['Jan 2005', 'Huygens lands on Titan'], ['2005', 'Enceladus plumes discovered'], ['Sep 2017', 'Grand Finale plunge']],
    facts: ['Cassini was crashed into Saturn to protect potentially habitable moons from contamination.', 'Huygens\' landing remains the most distant landing ever.'],
    quiz: [{ q: 'Why was Cassini deliberately crashed into Saturn?', options: ['It ran out of film', 'To avoid contaminating moons like Enceladus and Titan', 'To make a crater', 'By accident'], answer: 1, explain: 'Planetary protection: Earth microbes must not reach potentially habitable worlds.' }]
  },
  {
    id: 'newhorizons', name: 'New Horizons', agency: 'NASA', country: 'USA', launch: '19 January 2006',
    objective: 'First reconnaissance of Pluto and the Kuiper Belt.', target: 'Pluto, Charon, Arrokoth',
    spacecraft: 'Piano-sized, ≈478 kg, RTG powered; one of the fastest spacecraft ever launched.',
    discoveries: ['Pluto\'s heart-shaped nitrogen-ice plain', 'Water-ice mountains and blue hazes on Pluto', 'Close-up of Arrokoth, a pristine "contact binary" (1 Jan 2019)'],
    status: 'Operating in the Kuiper Belt (extended mission)', statusKind: 'active',
    timeline: [['Jan 2006', 'Launch'], ['Feb 2007', 'Jupiter gravity assist'], ['14 Jul 2015', 'Pluto flyby'], ['1 Jan 2019', 'Arrokoth flyby']],
    facts: ['It carries some of the ashes of Pluto\'s discoverer, Clyde Tombaugh.', 'It took about 16 months to send all its Pluto data home.'],
    quiz: [{ q: 'When did New Horizons fly past Pluto?', options: ['2006', '2010', '2015', '2019'], answer: 2, explain: 'Closest approach was on 14 July 2015.' }]
  },
  {
    id: 'curiosity', name: 'Curiosity (Mars Science Laboratory)', agency: 'NASA / JPL', country: 'USA', launch: '26 November 2011',
    objective: 'Determine whether Mars ever had environments able to support microbial life.', target: 'Gale Crater, Mars',
    spacecraft: 'Car-sized rover (≈899 kg) powered by an RTG; landed by the "sky crane".',
    discoveries: ['An ancient freshwater lake bed in Gale Crater', 'Complex organic molecules preserved in rock', 'Seasonal changes in atmospheric methane'],
    status: 'Operating, climbing Mount Sharp', statusKind: 'active',
    timeline: [['Nov 2011', 'Launch'], ['6 Aug 2012', 'Landing (UTC)'], ['2013', 'Confirms ancient habitable conditions'], ['2014', 'Reaches Mount Sharp']],
    facts: ['The "seven minutes of terror" describes its fully automated landing.', 'It has driven more than 30 km.'],
    quiz: [{ q: 'How was Curiosity lowered to the surface?', options: ['Airbags', 'A rocket-powered sky crane', 'A parachute only', 'A ramp from orbit'], answer: 1, explain: 'A hovering descent stage lowered the rover on cables.' }]
  },
  {
    id: 'perseverance', name: 'Perseverance & Ingenuity', agency: 'NASA / JPL', country: 'USA', launch: '30 July 2020',
    objective: 'Seek signs of ancient life and collect samples for future return to Earth.', target: 'Jezero Crater, Mars',
    spacecraft: '≈1,025 kg rover with a sample-caching system, plus the Ingenuity helicopter.',
    discoveries: ['Ingenuity made the first powered, controlled flight on another planet (19 April 2021)', 'MOXIE produced oxygen from Martian CO₂', 'Rock samples from an ancient river delta, including possible biosignature candidates'],
    status: 'Rover operating; Ingenuity ended its mission in January 2024 after 72 flights', statusKind: 'active',
    timeline: [['Jul 2020', 'Launch'], ['18 Feb 2021', 'Lands in Jezero Crater'], ['19 Apr 2021', 'Ingenuity\'s first flight'], ['Jan 2024', 'Ingenuity\'s final flight']],
    facts: ['Ingenuity was planned for 5 flights and made 72.', 'Perseverance carries microphones and recorded the first sounds from Mars\'s surface.'],
    quiz: [{ q: 'What did Ingenuity achieve?', options: ['First Mars landing', 'First powered flight on another planet', 'First Mars sample return', 'First human on Mars'], answer: 1, explain: 'The helicopter flew on 19 April 2021.' }]
  },
  {
    id: 'jwst', name: 'James Webb Space Telescope', agency: 'NASA / ESA / CSA', country: 'International', launch: '25 December 2021 (Ariane 5)',
    objective: 'Observe the first galaxies, star birth and exoplanet atmospheres in infrared light.', target: 'Sun–Earth L2 point (≈1.5 million km from Earth)',
    spacecraft: '6.5 m gold-coated beryllium mirror made of 18 segments; tennis-court-sized sunshield.',
    discoveries: ['Some of the most distant galaxies ever seen', 'CO₂ and other molecules in exoplanet atmospheres', 'Stunning infrared views of star-forming regions'],
    status: 'Operating', statusKind: 'active',
    timeline: [['25 Dec 2021', 'Launch'], ['Jan 2022', 'Arrives at L2 after unfolding'], ['12 Jul 2022', 'First full-colour images released']],
    facts: ['Its sunshield keeps instruments below −223 °C.', 'It sees infrared light that passes through dust clouds.'],
    quiz: [{ q: 'Which type of light is JWST mainly designed to see?', options: ['X-rays', 'Radio', 'Infrared', 'Gamma rays'], answer: 2, explain: 'Infrared reveals distant redshifted galaxies and hidden star nurseries.' }]
  },
  {
    id: 'parker', name: 'Parker Solar Probe', agency: 'NASA / JHU-APL', country: 'USA', launch: '12 August 2018',
    objective: '"Touch the Sun": study the corona and solar wind up close.', target: 'Sun',
    spacecraft: '≈685 kg probe with an 11.4 cm carbon-composite heat shield.',
    discoveries: ['First spacecraft to fly through the corona (April 2021)', 'Magnetic "switchbacks" in the solar wind', 'Record closest approach of ≈6.1 million km from the surface (24 Dec 2024)'],
    status: 'Operating', statusKind: 'active',
    timeline: [['Aug 2018', 'Launch'], ['Apr 2021', 'Enters the corona'], ['24 Dec 2024', 'Closest approach, ≈692,000 km/h']],
    facts: ['It is the fastest human-made object ever.', 'Its heat shield faces temperatures near 1,000 °C.'],
    quiz: [{ q: 'Parker Solar Probe holds the record for…', options: ['Largest telescope', 'Fastest human-made object', 'Longest Mars mission', 'Most moons visited'], answer: 1, explain: 'At closest approach it reached about 692,000 km/h.' }]
  },
  {
    id: 'clipper', name: 'Europa Clipper', agency: 'NASA', country: 'USA', launch: '14 October 2024 (Falcon Heavy)',
    objective: 'Determine whether Jupiter\'s moon Europa could support life.', target: 'Europa',
    spacecraft: 'NASA\'s largest planetary spacecraft; solar arrays span about 30 m.',
    discoveries: ['Cruise phase — science begins after arrival'],
    status: 'In cruise; Jupiter arrival planned for April 2030', statusKind: 'cruise',
    timeline: [['Oct 2024', 'Launch'], ['Mar 2025', 'Mars gravity assist'], ['Dec 2026', 'Earth gravity assist (planned)'], ['Apr 2030', 'Jupiter arrival (planned)']],
    facts: ['It will make about 49 close flybys of Europa.', 'It carries a poem by U.S. Poet Laureate Ada Limón.'],
    quiz: [{ q: 'What is Europa Clipper looking for?', options: ['Gold', 'Conditions that could support life', 'A new planet', 'Asteroids'], answer: 1, explain: 'It will study Europa\'s ice shell, ocean and chemistry.' }]
  },
  {
    id: 'rosetta', name: 'Rosetta & Philae', agency: 'ESA', country: 'Europe', launch: '2 March 2004',
    objective: 'Orbit and land on a comet to study its nucleus and evolution.', target: 'Comet 67P/Churyumov–Gerasimenko',
    spacecraft: 'Rosetta orbiter (≈3,000 kg) and the 100 kg Philae lander.',
    discoveries: ['First spacecraft to orbit a comet and first soft landing on one (12 Nov 2014)', 'Comet water differs in isotopes from Earth\'s oceans', 'Organic molecules, including glycine, in the comet\'s coma'],
    status: 'Completed — Rosetta made a controlled landing on 67P on 30 September 2016', statusKind: 'complete',
    timeline: [['Mar 2004', 'Launch'], ['Aug 2014', 'Arrives at 67P'], ['12 Nov 2014', 'Philae lands (and bounces twice)'], ['Sep 2016', 'Mission ends on the comet']],
    facts: ['Philae\'s harpoons failed, so it bounced into a shadowed spot.', 'The mission is named after the Rosetta Stone.'],
    quiz: [{ q: 'What did Philae land on?', options: ['An asteroid', 'A comet', 'Mars', 'Titan'], answer: 1, explain: 'It landed on comet 67P in November 2014.' }]
  },
  {
    id: 'bepi', name: 'BepiColombo', agency: 'ESA / JAXA', country: 'Europe & Japan', launch: '20 October 2018',
    objective: 'Put two orbiters around Mercury to study its surface, interior and magnetic field.', target: 'Mercury',
    spacecraft: 'ESA\'s Mercury Planetary Orbiter and JAXA\'s Mio magnetospheric orbiter, carried by a transfer module.',
    discoveries: ['Six Mercury flybys returned close-up images and magnetic data (2021–2025)'],
    status: 'In cruise; Mercury orbit arrival planned for late 2026', statusKind: 'cruise',
    timeline: [['Oct 2018', 'Launch'], ['Oct 2021', 'First Mercury flyby'], ['Jan 2025', 'Sixth and final flyby'], ['Late 2026', 'Mercury orbit insertion (planned)']],
    facts: ['It uses nine planetary flybys to slow down enough to orbit Mercury.', 'Named after Italian scientist Giuseppe "Bepi" Colombo.'],
    quiz: [{ q: 'Which two agencies built BepiColombo?', options: ['NASA & ISRO', 'ESA & JAXA', 'CNSA & Roscosmos', 'SpaceX & NASA'], answer: 1, explain: 'It is a joint European–Japanese mission.' }]
  },
  {
    id: 'solarorbiter', name: 'Solar Orbiter', agency: 'ESA / NASA', country: 'International', launch: '10 February 2020 (UTC)',
    objective: 'Study the Sun up close, including the first views of its poles.', target: 'Sun',
    spacecraft: 'Ten instruments behind a titanium heat shield.',
    discoveries: ['Tiny solar flares nicknamed "campfires"', 'First images of the Sun\'s south pole (2025)'],
    status: 'Operating', statusKind: 'active',
    timeline: [['Feb 2020', 'Launch'], ['2020', '"Campfires" discovered'], ['2025', 'Orbit tilted to view the poles']],
    facts: ['It comes closer to the Sun than Mercury does.', 'Its orbit is gradually tilted using Venus flybys.'],
    quiz: [{ q: 'What were the tiny flares Solar Orbiter discovered nicknamed?', options: ['Sparklers', 'Campfires', 'Fireflies', 'Embers'], answer: 1, explain: 'These mini-flares may help heat the corona.' }]
  },
  {
    id: 'juice', name: 'Juice (JUpiter ICy moons Explorer)', agency: 'ESA', country: 'Europe', launch: '14 April 2023 (Ariane 5)',
    objective: 'Study Jupiter\'s icy moons Ganymede, Callisto and Europa as potential habitats.', target: 'Jupiter system, Ganymede',
    spacecraft: '≈6,000 kg spacecraft with 85 m² of solar arrays.',
    discoveries: ['World-first lunar–Earth double gravity assist (August 2024)'],
    status: 'In cruise; Jupiter arrival planned for July 2031', statusKind: 'cruise',
    timeline: [['Apr 2023', 'Launch'], ['Aug 2024', 'Moon and Earth flybys'], ['Aug 2025', 'Venus flyby'], ['Jul 2031', 'Jupiter arrival (planned)'], ['Dec 2034', 'Ganymede orbit (planned)']],
    facts: ['It will be the first spacecraft to orbit a moon other than Earth\'s Moon.'],
    quiz: [{ q: 'Which moon will Juice orbit?', options: ['Europa', 'Ganymede', 'Io', 'Titan'], answer: 1, explain: 'It plans to enter orbit around Ganymede in 2034.' }]
  },
  {
    id: 'gaia', name: 'Gaia', agency: 'ESA', country: 'Europe', launch: '19 December 2013',
    objective: 'Build the most precise 3D map of the Milky Way.', target: 'Milky Way (from Sun–Earth L2)',
    spacecraft: 'Two telescopes feeding a billion-pixel camera.',
    discoveries: ['Positions and motions of about 1.8 billion stars (Data Release 3, 2022)', 'Evidence of ancient galaxy mergers in the Milky Way\'s history'],
    status: 'Retired — science observations ended January 2025; switched off March 2025. Data releases continue.', statusKind: 'complete',
    timeline: [['Dec 2013', 'Launch'], ['2016', 'Data Release 1'], ['2022', 'Data Release 3'], ['Mar 2025', 'Spacecraft passivated']],
    facts: ['Gaia measured star positions as precisely as seeing a coin on the Moon from Earth.'],
    quiz: [{ q: 'What was Gaia\'s main goal?', options: ['Land on Mars', 'Map the Milky Way in 3D', 'Study black holes', 'Visit comets'], answer: 1, explain: 'It charted positions, distances and motions of ≈1.8 billion stars.' }]
  },
  {
    id: 'euclid', name: 'Euclid', agency: 'ESA (with NASA)', country: 'Europe', launch: '1 July 2023 (Falcon 9)',
    objective: 'Map billions of galaxies to investigate dark matter and dark energy.', target: 'Deep sky (from Sun–Earth L2)',
    spacecraft: '1.2 m telescope with visible imager and near-infrared spectrometer.',
    discoveries: ['First "Quick Release" survey data (March 2025)', 'Wide, sharp views revealing gravitational lenses'],
    status: 'Operating', statusKind: 'active',
    timeline: [['Jul 2023', 'Launch'], ['Nov 2023', 'First images'], ['Mar 2025', 'First survey data release']],
    facts: ['It will survey about one-third of the sky.'],
    quiz: [{ q: 'Euclid studies which mysteries?', options: ['Martian weather', 'Dark matter and dark energy', 'Solar flares', 'Lunar soil'], answer: 1, explain: 'It maps how galaxies and dark matter are distributed over cosmic time.' }]
  },
  {
    id: 'chandrayaan', name: 'Chandrayaan Missions', agency: 'ISRO', country: 'India', launch: 'Chandrayaan-1: 22 Oct 2008; -2: 22 Jul 2019; -3: 14 Jul 2023',
    objective: 'Explore the Moon from orbit and land near the lunar south pole.', target: 'Moon',
    spacecraft: 'Chandrayaan-3: Vikram lander and Pragyan rover with a propulsion module.',
    discoveries: ['Chandrayaan-1 (with NASA\'s M³) helped detect water molecules on the Moon', 'Chandrayaan-3 landed near the south pole on 23 August 2023', 'Pragyan measured sulfur in the lunar south-polar soil'],
    status: 'Chandrayaan-3 completed; Chandrayaan-2 orbiter still operating', statusKind: 'complete',
    timeline: [['2008', 'Chandrayaan-1 orbiter'], ['2019', 'Chandrayaan-2 orbiter succeeds; lander lost'], ['23 Aug 2023', 'Chandrayaan-3 lands near south pole']],
    facts: ['India became the fourth country to soft-land on the Moon and the first near its south pole.'],
    quiz: [{ q: 'Where did Chandrayaan-3 land?', options: ['Near the lunar south pole', 'On the far side', 'Sea of Tranquility', 'On Mars'], answer: 0, explain: 'It touched down on 23 August 2023.' }]
  },
  {
    id: 'mangalyaan', name: 'Mangalyaan (Mars Orbiter Mission)', agency: 'ISRO', country: 'India', launch: '5 November 2013',
    objective: 'Demonstrate interplanetary capability and study Mars\'s atmosphere and surface.', target: 'Mars',
    spacecraft: '≈1,350 kg orbiter with five science instruments.',
    discoveries: ['Full-disc colour images of Mars', 'Measurements of Mars\'s exosphere'],
    status: 'Completed — contact lost in 2022 after about 8 years (designed for 6 months)', statusKind: 'complete',
    timeline: [['Nov 2013', 'Launch'], ['24 Sep 2014', 'Enters Mars orbit'], ['2022', 'Mission declared over']],
    facts: ['India was the first Asian nation to reach Mars orbit, and the first nation to do so on its first attempt.', 'It cost about US$74 million.'],
    quiz: [{ q: 'What record did Mangalyaan set?', options: ['First Mars landing', 'First nation to reach Mars orbit on its first attempt', 'First Mars helicopter', 'Fastest trip to Mars'], answer: 1, explain: 'It entered orbit on 24 September 2014.' }]
  },
  {
    id: 'hayabusa', name: 'Hayabusa & Hayabusa2', agency: 'JAXA', country: 'Japan', launch: 'Hayabusa: 9 May 2003; Hayabusa2: 3 December 2014',
    objective: 'Return samples from asteroids to Earth.', target: 'Asteroids Itokawa and Ryugu',
    spacecraft: 'Ion-engine spacecraft with sample-collection horns and re-entry capsules.',
    discoveries: ['First asteroid sample return (Itokawa, June 2010)', 'Hayabusa2 returned 5.4 g of Ryugu material (Dec 2020) containing amino acids', 'Created an artificial crater on Ryugu with an impactor'],
    status: 'Hayabusa completed; Hayabusa2 on an extended mission to asteroid 1998 KY26 (arrival ≈2031)', statusKind: 'active',
    timeline: [['2005', 'Hayabusa at Itokawa'], ['Jun 2010', 'Itokawa samples land in Australia'], ['2018–19', 'Hayabusa2 at Ryugu'], ['6 Dec 2020', 'Ryugu samples land in Australia']],
    facts: ['"Hayabusa" means peregrine falcon.'],
    quiz: [{ q: 'What did Hayabusa2 bring back?', options: ['Moon rocks', 'Samples from asteroid Ryugu', 'Comet dust', 'Martian air'], answer: 1, explain: '5.4 g of Ryugu material landed in Australia in December 2020.' }]
  },
  {
    id: 'change', name: 'Chang\'e Lunar Program', agency: 'CNSA', country: 'China', launch: 'Chang\'e 1: 2007 … Chang\'e 6: 3 May 2024',
    objective: 'Orbit, land on and return samples from the Moon.', target: 'Moon',
    spacecraft: 'Orbiters, landers, Yutu rovers and sample-return vehicles.',
    discoveries: ['Chang\'e 4: first soft landing on the far side (3 Jan 2019)', 'Chang\'e 5: returned 1,731 g of samples (Dec 2020)', 'Chang\'e 6: first samples from the far side (returned 25 June 2024)'],
    status: 'Ongoing program; Chang\'e 7 and 8 planned', statusKind: 'active',
    timeline: [['2007', 'Chang\'e 1 orbiter'], ['Dec 2013', 'Chang\'e 3 + Yutu rover land'], ['Jan 2019', 'Chang\'e 4 lands on far side'], ['Dec 2020', 'Chang\'e 5 sample return'], ['Jun 2024', 'Chang\'e 6 far-side samples']],
    facts: ['Chang\'e is named after the Moon goddess in Chinese mythology.'],
    quiz: [{ q: 'Which Chang\'e mission returned the first far-side samples?', options: ['Chang\'e 3', 'Chang\'e 4', 'Chang\'e 5', 'Chang\'e 6'], answer: 3, explain: 'Chang\'e 6 returned them in June 2024.' }]
  },
  {
    id: 'artemis', name: 'Artemis Program', agency: 'NASA with ESA, JAXA, CSA and partners', country: 'International', launch: 'Artemis I: 16 November 2022',
    objective: 'Return humans to the Moon, including the south-polar region, and prepare for Mars.', target: 'Moon',
    spacecraft: 'Space Launch System (SLS), Orion crew capsule with ESA\'s service module, Gateway station (planned).',
    discoveries: ['Artemis I tested Orion on an uncrewed 25.5-day lunar flight'],
    status: 'Artemis II crewed lunar flyby targeted for 2026; Artemis III landing planned later', statusKind: 'active',
    timeline: [['Nov 2022', 'Artemis I uncrewed flight'], ['2026 (target)', 'Artemis II — 4 astronauts fly around the Moon'], ['Planned', 'Artemis III — crewed landing']],
    facts: ['The Artemis II crew includes Canadian astronaut Jeremy Hansen.', 'Artemis is Apollo\'s twin sister in Greek mythology.'],
    quiz: [{ q: 'In Greek mythology, Artemis is the twin of…', options: ['Zeus', 'Apollo', 'Hermes', 'Athena'], answer: 1, explain: 'The program name links back to Apollo.' }]
  },
  {
    id: 'dragon', name: 'SpaceX Crew Dragon', agency: 'SpaceX (with NASA Commercial Crew)', country: 'USA', launch: 'Demo-2: 30 May 2020',
    objective: 'Carry astronauts to the ISS and private crews to orbit.', target: 'Low Earth orbit / ISS',
    spacecraft: 'Reusable capsule for up to 4 crew (7 designed), launched on Falcon 9.',
    discoveries: ['First crewed orbital flight by a commercial spacecraft (Demo-2)', 'Inspiration4: first all-civilian orbital mission (Sept 2021)', 'Polaris Dawn: first commercial spacewalk (Sept 2024)'],
    status: 'Operating', statusKind: 'active',
    timeline: [['May 2020', 'Demo-2 with Behnken & Hurley'], ['Nov 2020', 'Crew-1, first operational flight'], ['Sep 2021', 'Inspiration4'], ['Sep 2024', 'Polaris Dawn spacewalk']],
    facts: ['Falcon 9 first stages land and are reused many times.'],
    quiz: [{ q: 'What was historic about Demo-2 in 2020?', options: ['First Moon landing', 'First crewed orbital flight on a commercial spacecraft', 'First Mars flight', 'First space station'], answer: 1, explain: 'Bob Behnken and Doug Hurley flew to the ISS on Crew Dragon.' }]
  }
];
