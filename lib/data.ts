import {
  Flower2,
  Lamp,
  Frame,
  Gift,
  Sofa,
  Utensils,
  Sparkles,
  Layers,
  Shield,
  Brush,
  Building2,
  Wrench,
} from 'lucide-react';

export type IconType = string;

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  icon: IconType;
  productCount: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  badge?: 'New' | 'Bestseller' | 'Limited';
  description: string;
};

export type Service = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  icon: IconType;
  image: string;
  features: string[];
  isPublished?: boolean;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
};

export type InstagramPost = {
  id: string;
  type: 'reel' | 'post';
  category: 'Recent Work' | 'Behind The Scenes' | 'Workshop' | 'Product';
  image: string;
  caption: string;
  reelUrl?: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type ProcessStep = {
  step: string;
  title: string;
  description: string;
  icon: IconType;
};

export const categories: Category[] = [
  {
    slug: 'home-decor',
    name: 'Home Decor',
    tagline: 'Sculptural pieces for considered interiors',
    description:
      'Statement objects, vases and sculptural accents crafted to anchor a room with quiet confidence.',
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1200',
    icon: 'flower-2',
    productCount: 48,
  },
  {
    slug: 'decorative-accessories',
    name: 'Decorative Accessories',
    tagline: 'The finishing touch',
    description:
      'Trays, candleholders and curated objects that bring warmth and texture to every surface.',
    image:
      'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&w=1200',
    icon: 'frame',
    productCount: 36,
  },
  {
    slug: 'gift-articles',
    name: 'Gift Articles',
    tagline: 'Gifting, elevated',
    description:
      'Thoughtfully designed gifts for milestones, celebrations and the people who matter most.',
    image:
      'https://images.pexels.com/photos/6585755/pexels-photo-6585755.jpeg?auto=compress&cs=tinysrgb&w=1200',
    icon: 'gift',
    productCount: 24,
  },
  {
    slug: 'lifestyle-products',
    name: 'Lifestyle Products',
    tagline: 'Live beautifully',
    description:
      'Lighting, textiles and everyday objects designed to make daily rituals feel considered.',
    image:
      'https://images.pexels.com/photos/6585758/pexels-photo-6585758.jpeg?auto=compress&cs=tinysrgb&w=1200',
    icon: 'lamp',
    productCount: 32,
  },
  {
    slug: 'household-products',
    name: 'Household Products',
    tagline: 'Quiet utility',
    description:
      'Functional essentials refined for the modern home — beautiful, durable and made to last.',
    image:
      'https://images.pexels.com/photos/6585607/pexels-photo-6585607.jpeg?auto=compress&cs=tinysrgb&w=1200',
    icon: 'sofa',
    productCount: 28,
  },
  {
    slug: 'daily-utility',
    name: 'Daily Utility',
    tagline: 'Everyday, refined',
    description:
      'Cutlery, organisers and daily essentials elevated through material and craft.',
    image:
      'https://images.pexels.com/photos/6585591/pexels-photo-6585591.jpeg?auto=compress&cs=tinysrgb&w=1200',
    icon: 'utensils',
    productCount: 20,
  },
];

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'onyx-sculptural-vase',
    name: 'Onyx Sculptural Vase',
    category: 'home-decor',
    price: 189,
    originalPrice: 240,
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.9,
    badge: 'Bestseller',
    description: 'Hand-finished ceramic vase with a matte onyx glaze.',
  },
  {
    id: 'p2',
    slug: 'brass-pendant-lamp',
    name: 'Brass Pendant Lamp',
    category: 'lifestyle-products',
    price: 320,
    image:
      'https://images.pexels.com/photos/6585758/pexels-photo-6585758.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.8,
    badge: 'New',
    description: 'Warm-glow pendant light in hand-spun brass.',
  },
  {
    id: 'p3',
    slug: 'marble-catch-all-tray',
    name: 'Marble Catch-All Tray',
    category: 'decorative-accessories',
    price: 95,
    image:
      'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.7,
    description: 'Honed marble tray with brushed brass edges.',
  },
  {
    id: 'p4',
    slug: 'heritage-gift-set',
    name: 'Heritage Gift Set',
    category: 'gift-articles',
    price: 145,
    image:
      'https://images.pexels.com/photos/6585755/pexels-photo-6585755.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 5.0,
    badge: 'Limited',
    description: 'A curated set of objects in a keepsake box.',
  },
  {
    id: 'p5',
    slug: 'linen-lumbar-cushion',
    name: 'Linen Lumbar Cushion',
    category: 'household-products',
    price: 78,
    image:
      'https://images.pexels.com/photos/6585607/pexels-photo-6585607.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.6,
    description: 'Belgian linen cushion with a feather-down fill.',
  },
  {
    id: 'p6',
    slug: 'gold-cutlery-set',
    name: 'Gold Cutlery Set',
    category: 'daily-utility',
    price: 210,
    originalPrice: 260,
    image:
      'https://images.pexels.com/photos/6585591/pexels-photo-6585591.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.9,
    badge: 'Bestseller',
    description: '16-piece cutlery set with a PVD gold finish.',
  },
  {
    id: 'p7',
    slug: 'smoked-glass-hurricane',
    name: 'Smoked Glass Hurricane',
    category: 'home-decor',
    price: 128,
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.8,
    description: 'Mouth-blown glass hurricane candleholder.',
  },
  {
    id: 'p8',
    slug: 'walnut-desk-organiser',
    name: 'Walnut Desk Organiser',
    category: 'daily-utility',
    price: 64,
    image:
      'https://images.pexels.com/photos/6585591/pexels-photo-6585591.jpeg?auto=compress&cs=tinysrgb&w=800',
    rating: 4.7,
    badge: 'New',
    description: 'Solid walnut organiser with brass dividers.',
  },
];

export const services: Service[] = [
  {
    slug: 'metal-restoration',
    name: 'Metal Restoration',
    shortName: 'Restoration',
    description: 'Restoration and refinishing for worn or aged metal surfaces.',
    longDescription:
      'We assess, prepare and refinish worn or aged metal components — removing surface damage, corrosion and degraded coatings before applying a fresh, durable finish that restores the piece to a consistent and presentable standard.',
    icon: 'wrench',
    image:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Surface assessment and preparation',
      'Corrosion and damage removal',
      'Refinishing to specified finish',
      'Suitable for furniture and fittings',
    ],
    isPublished: true,
  },
  {
    slug: 'murti-finishing',
    name: 'Murti Finishing',
    shortName: 'Murti',
    description: 'Surface finishing for decorative and devotional idols.',
    longDescription:
      'Careful surface finishing for decorative and devotional idols, applied with attention to form and detail. We work with a range of materials and finishes suited to ornamental and religious figurines.',
    icon: 'sparkles',
    image:
      'https://images.pexels.com/photos/8216554/pexels-photo-8216554.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Suitable for decorative and devotional pieces',
      'Detail-preserving surface treatment',
      'Range of finish options available',
      'Handled with care throughout',
    ],
    isPublished: true,
  },
  {
    slug: 'plastic-coating',
    name: 'Plastic Coating',
    shortName: 'Plastic',
    description: 'Coating and finishing for suitable plastic components.',
    longDescription:
      'We apply surface coatings to suitable plastic components, providing a refined finish that improves appearance and adds a degree of surface protection. Suitability is assessed per component and material type.',
    icon: 'layers',
    image:
      'https://images.pexels.com/photos/8216570/pexels-photo-8216570.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Assessed per component and substrate',
      'Decorative and protective finish options',
      'Consistent surface coverage',
      'Suitable for selected applications',
    ],
    isPublished: true,
  },
  {
    slug: 'electroplating',
    name: 'Electroplating',
    shortName: 'Electroplating',
    description: 'Metal surface treatments for decorative and functional applications.',
    longDescription:
      'Electroplating services for decorative and functional metal components. We apply metal coatings to base materials to achieve specific surface characteristics — including appearance, corrosion resistance and finish quality.',
    icon: 'shield',
    image:
      'https://images.pexels.com/photos/8216580/pexels-photo-8216580.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Decorative and functional applications',
      'Consistent finish across batch runs',
      'Multiple plating options',
      'Suitable for hardware and fittings',
    ],
    isPublished: true,
  },
  {
    slug: 'marble-coating',
    name: 'Marble Coating',
    shortName: 'Marble',
    description: 'Surface finishes for marble and marble-based decorative pieces.',
    longDescription:
      'We apply specialist surface finishes to marble and marble-based decorative items, enhancing their appearance and providing a protective treatment suited to the material and intended use.',
    icon: 'brush',
    image:
      'https://images.pexels.com/photos/6585598/pexels-photo-6585598.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Suited to marble and composite stone',
      'Protective and decorative finish options',
      'Applied to decorative and display pieces',
      'Handled with appropriate care',
    ],
    isPublished: true,
  },
  {
    slug: 'decorative-showpieces',
    name: 'Decorative Showpieces',
    shortName: 'Showpieces',
    description: 'Finishing for ornamental pieces and decorative objects.',
    longDescription:
      'Surface finishing for ornamental pieces and decorative objects intended for display. We work across a range of materials and finish types, prioritising visual quality and consistency across each piece.',
    icon: 'sparkles',
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Ornamental and display pieces',
      'Range of decorative finish options',
      'Consistent across individual and batch work',
      'Careful handling throughout',
    ],
    isPublished: true,
  },
  {
    slug: 'lipping-work',
    name: 'Lipping Work',
    shortName: 'Lipping',
    description: 'Detail-focused edge and lipping finishes for selected applications.',
    longDescription:
      'We carry out lipping and edge finishing work for selected furniture and fabrication applications, applying clean and consistent surface treatment to exposed edges and border details.',
    icon: 'building-2',
    image:
      'https://images.pexels.com/photos/8216588/pexels-photo-8216588.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Edge and border finishing',
      'Furniture and fabrication applications',
      'Consistent finish quality',
      'Available as part of broader projects',
    ],
    isPublished: true,
  },
  {
    slug: 'wood-finishing',
    name: 'Wood Finishing',
    shortName: 'Wood',
    description: 'Finishing solutions for wooden surfaces and decorative elements.',
    longDescription:
      'Surface finishing for wooden items including furniture components and decorative wooden elements. We apply finishes suited to the wood type and intended use, focusing on even coverage and a clean final appearance.',
    icon: 'layers',
    image:
      'https://images.pexels.com/photos/6585755/pexels-photo-6585755.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Wooden furniture and decorative elements',
      'Finish options suited to material and use',
      'Even surface coverage',
      'Handled appropriately per item',
    ],
    isPublished: true,
  },
  {
    slug: 'sanitary-finishing',
    name: 'Sanitary Finishing',
    shortName: 'Sanitary',
    description: 'Surface finishing for sanitary fittings and related components.',
    longDescription:
      'We provide surface finishing for sanitary fittings and related components, applying coatings that improve appearance and provide a consistent surface treatment suitable for bathroom and utility hardware.',
    icon: 'shield',
    image:
      'https://images.pexels.com/photos/6585591/pexels-photo-6585591.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Sanitary fittings and bathroom hardware',
      'Decorative surface finish options',
      'Consistent finish across components',
      'Suitable for trade and individual commissions',
    ],
    isPublished: true,
  },
];


export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Aanya Mehta',
    role: 'Principal Architect',
    company: 'Studio Aanya',
    content:
      'The brass coating work on our flagship project was flawless. The finish quality rivals solid brass at a fraction of the cost — and the team understood our design intent immediately.',
    rating: 5,
    avatar:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 't2',
    name: 'Rohan Kapoor',
    role: 'Interior Designer',
    company: 'Kapoor Interiors',
    content:
      'Their home decor pieces have become my go-to for clients who want quiet luxury. The craftsmanship is exceptional and every object feels considered.',
    rating: 5,
    avatar:
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    id: 't3',
    name: 'Sara Chen',
    role: 'Procurement Lead',
    company: 'Meridian Developments',
    content:
      'We specified their architectural metal finishes across a 40-storey development. Performance, consistency and lead times all exceeded expectations.',
    rating: 5,
    avatar:
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

export const faqs: FAQItem[] = [
  {
    question: 'Do you ship home decor products internationally?',
    answer:
      'Yes. We ship our home decor and lifestyle collections worldwide with insured, tracked delivery. Shipping costs are calculated at checkout based on destination and weight.',
  },
  {
    question: 'Can I order custom metal coating for a single piece?',
    answer:
      'Absolutely. We work with everyone from individual homeowners to large commercial fabricators. Whether it is one statement piece or a full production run, our team can accommodate your project.',
  },
  {
    question: 'What is the typical turnaround for coating services?',
    answer:
      'Standard finishes are completed within 5–7 business days. Custom colour development and large architectural projects may take 2–4 weeks depending on scope. We will provide a precise timeline with your quote.',
  },
  {
    question: 'Are your metal finishes suitable for outdoor use?',
    answer:
      'Our architectural and premium surface finishes are engineered for exterior environments with UV stability and corrosion resistance. We will recommend the right system based on your application.',
  },
  {
    question: 'Do you offer trade or bulk pricing?',
    answer:
      'Yes. We work with architects, designers, builders and commercial buyers on trade terms. Contact us with your project details and we will prepare a tailored proposal.',
  },
];

export const processSteps: ProcessStep[] = [
  {
    step: '01',
    title: 'Consultation',
    description:
      'We begin with a conversation to understand your vision, materials, timeline and performance requirements.',
    icon: 'sparkles',
  },
  {
    step: '02',
    title: 'Specification',
    description:
      'Our team develops a precise coating specification — finish, colour, texture and durability targets.',
    icon: 'layers',
  },
  {
    step: '03',
    title: 'Surface Preparation',
    description:
      'Meticulous cleaning, stripping and pre-treatment to ensure a flawless, long-lasting bond.',
    icon: 'brush',
  },
  {
    step: '04',
    title: 'Application',
    description:
      'Coatings applied in a controlled environment using calibrated equipment for uniform coverage.',
    icon: 'shield',
  },
  {
    step: '05',
    title: 'Quality Inspection',
    description:
      'Every piece is inspected against our quality standards before it leaves the workshop.',
    icon: 'wrench',
  },
];

export const instagramPosts: InstagramPost[] = [
  {
    id: 'reel-1',
    type: 'reel',
    category: 'Recent Work',
    image: '/hero-coating-process.jpg',
    caption: 'Brass coating transformation in progress',
    reelUrl: 'https://www.instagram.com/reel/DIJaKF0yOUB/',
  },
  {
    id: 'reel-2',
    type: 'reel',
    category: 'Recent Work',
    image: '/hero-metal-art-decor.jpg',
    caption: 'Decorative metal art finishing process',
    reelUrl: 'https://www.instagram.com/reel/DTmnpdaCpfR/',
  },
  {
    id: 'reel-3',
    type: 'reel',
    category: 'Workshop',
    image: '/hero-brass-interior.jpg',
    caption: 'Workshop surface finishing detail',
    reelUrl: 'https://www.instagram.com/reel/DMMgialztKn/',
  },
  {
    id: 'reel-4',
    type: 'reel',
    category: 'Recent Work',
    image: '/after-metal-polished.jpg',
    caption: 'Custom metal coating application',
    reelUrl: 'https://www.instagram.com/reel/DKHrktoiYm9/',
  },
  {
    id: 'reel-5',
    type: 'reel',
    category: 'Behind The Scenes',
    image: '/before-metal-worn.jpg',
    caption: 'Restoration and polishing workflow',
    reelUrl: 'https://www.instagram.com/reel/DbfIhh7NpRs/',
  },
  {
    id: 'reel-6',
    type: 'reel',
    category: 'Workshop',
    image: '/hero-coating-process.jpg',
    caption: 'Precision metal finishing techniques',
    reelUrl: 'https://www.instagram.com/reel/DbfLq2WNaR4/',
  },
  {
    id: 'reel-7',
    type: 'reel',
    category: 'Recent Work',
    image: '/hero-brass-interior.jpg',
    caption: 'Architectural facade panel reveal',
    reelUrl: 'https://www.instagram.com/reel/DMhCL-Nzx_Y/',
  },
];

export const industriesServed = [
  'Architecture',
  'Interior Design',
  'Hospitality',
  'Real Estate',
  'Automotive',
  'Furniture',
  'Sculpture & Art',
  'Retail Fixtures',
];

export const businessDivisions = [
  {
    slug: 'home-decor',
    title: 'Home Decor & Lifestyle',
    subtitle: 'Division 01',
    description:
      'A curated collection of home decor, decorative accessories, gift articles and daily utility products — designed for considered living and crafted to last.',
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=1400',
    cta: { label: 'Explore the Collection', href: '/home-decor' },
    points: [
      'Home Decor & Decorative Accessories',
      'Gift Articles & Lifestyle Products',
      'Household & Daily Utility Essentials',
    ],
  },
  {
    slug: 'metal-coating',
    title: 'Premium Metal Coating',
    subtitle: 'Division 02',
    description:
      'Specialist coating and finishing services for metals — from brass and MS coating to architectural finishes, delivered to an exacting standard for trade and private clients.',
    image:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1400',
    cta: { label: 'Explore the Services', href: '/metal-coating' },
    points: [
      'MS & Brass Coating',
      'Decorative & Premium Surface Finishing',
      'Architectural & Custom Metal Finishes',
    ],
  },
];

export const whyChooseUs = [
  {
    icon: 'sparkles',
    title: 'Craftsmanship First',
    description:
      'Every product and finish is the result of obsessive attention to material, detail and craft.',
  },
  {
    icon: 'shield',
    title: 'Built to Last',
    description:
      'Coatings engineered for decades of performance. Products made to be lived with, not replaced.',
  },
  {
    icon: 'building-2',
    title: 'Trade & Commercial Ready',
    description:
      'Trusted by architects, designers and builders for projects of any scale.',
  },
  {
    icon: 'wrench',
    title: 'Bespoke Capability',
    description:
      'From a single statement piece to full production runs, we tailor every detail to your brief.',
  },
];
