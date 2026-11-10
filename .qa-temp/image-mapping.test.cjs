const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getServiceApplications } = require('./out/metal-service-content.js');

const publicDir = path.resolve(__dirname, '..', 'public');

const services = [
  {
    name: 'PVD Coating',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Coating_deposition_machine_by_evaporation_at_LAAS_0473.jpg/960px-Coating_deposition_machine_by_evaporation_at_LAAS_0473.jpg',
    applications: [
      'Selected stainless-steel components',
      'Decorative architectural hardware',
      'Metal fixtures and fittings',
      'Interior metal accents',
      'Custom decorative components',
    ],
  },
  {
    name: 'Electroplating',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Barrel_Plating_For_Small_Parts.jpg/960px-Barrel_Plating_For_Small_Parts.jpg',
    applications: [
      'Metal hardware and fittings',
      'Decorative components',
      'Fixtures and selected architectural accessories',
      'Metal furniture hardware',
      'Components requiring a specified plated surface',
    ],
  },
  {
    name: 'PU Coating',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Local_painter_on_duty.jpg/960px-Local_painter_on_duty.jpg',
    applications: [
      'Suitable metal panels and components',
      'Decorative furniture elements',
      'Interior architectural components',
      'Selected fabricated surfaces',
      'Other compatible substrates, if supported by the coating system',
    ],
  },
  {
    name: 'Powder Coating',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Powder_Coating_Spraying.JPG/960px-Powder_Coating_Spraying.JPG',
    applications: [
      'Fabricated metal components',
      'Steel or aluminium frames',
      'Metal furniture structures',
      'Railings and architectural fittings',
      'Selected industrial enclosures or hardware',
    ],
  },
  {
    name: 'Decorative Metal Finishing',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Brushed_metal.jpg/960px-Brushed_metal.jpg',
    applications: [
      'Decorative wall features',
      'Metal partitions and screens',
      'Furniture accents and metal bases',
      'Architectural trims and borders',
      'Decorative hardware',
      'Metal sculptures and display pieces',
    ],
  },
  {
    name: 'Metal Restoration & Refinishing',
    image:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Finishing_the_Wheel_Face.jpg/960px-Finishing_the_Wheel_Face.jpg',
    applications: [
      'Metal furniture and fittings',
      'Decorative architectural hardware',
      'Existing metal frames and accessories',
      'Ornamental metal pieces',
      'Worn or aged metal components',
    ],
  },
];

let failures = 0;

for (const service of services) {
  const cards = getServiceApplications(service);
  const images = cards.map((card) => card.image);
  const duplicates = images.filter(
    (image, index) => images.indexOf(image) !== index
  );

  for (const card of cards) {
    if (card.image.startsWith('/')) {
      const file = path.join(publicDir, card.image.slice(1));
      if (!fs.existsSync(file)) {
        console.error(`MISSING_ASSET ${card.image}`);
        failures += 1;
      }
    }
  }

  console.log(`\n${service.name}`);
  cards.forEach((card) => console.log(`  ${card.title} -> ${card.image}`));

  if (duplicates.length > 0) {
    console.error(`  DUPLICATE_IMAGES ${[...new Set(duplicates)].join(', ')}`);
    failures += 1;
  }

  assert.strictEqual(images.length, service.applications.length);
}

console.log(
  failures === 0 ? '\nIMAGE_MAPPING_OK' : `\nIMAGE_MAPPING_FAILURES=${failures}`
);
process.exit(failures === 0 ? 0 : 1);
