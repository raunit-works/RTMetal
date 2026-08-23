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

export type IconType = typeof Flower2;

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
    icon: Flower2,
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
    icon: Frame,
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
    icon: Gift,
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
    icon: Lamp,
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
    icon: Sofa,
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
    icon: Utensils,
    productCount: 20,
  },
];

export const products: Product[] = [
  {
    id: 'p1',
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
    slug: 'ms-coating',
    name: 'MS Coating',
    shortName: 'MS Coating',
    description: 'Premium mild steel coating for durability and finish.',
    longDescription:
      'Our MS coating process applies a refined, protective finish to mild steel components — combining corrosion resistance with a premium surface that elevates any fabrication.',
    icon: Layers,
    image:
      'https://images.pexels.com/photos/8486/soldering-iron-electronics-technology-soldering.jpg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Corrosion-resistant finish',
      'Uniform matte or gloss options',
      'Suitable for structural & decorative steel',
      'Architectural-grade durability',
    ],
  },
  {
    slug: 'brass-coating',
    name: 'Brass Coating',
    shortName: 'Brass',
    description: 'Authentic brass finishes on any substrate.',
    longDescription:
      'Transform steel, aluminium or wood with a lustrous brass coating. Achieve the warmth and prestige of solid brass at a fraction of the weight and cost.',
    icon: Sparkles,
    image:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Authentic brass appearance',
      'PVD-grade wear resistance',
      'Antique & polished variants',
      'Ideal for fixtures & hardware',
    ],
  },
  {
    slug: 'decorative-metal-finishing',
    name: 'Decorative Metal Finishing',
    shortName: 'Decorative',
    description: 'Artisan finishes for statement pieces.',
    longDescription:
      'Hand-applied patinas, brushing and polishing techniques that turn metal surfaces into works of art — for furniture, sculpture and architectural detail.',
    icon: Brush,
    image:
      'https://images.pexels.com/photos/8216554/pexels-photo-8216554.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Hand-applied patinas',
      'Brushed, mirror & satin finishes',
      'Custom colour development',
      'One-of-a-kind results',
    ],
  },
  {
    slug: 'premium-surface-finishing',
    name: 'Premium Surface Finishing',
    shortName: 'Surface',
    description: 'Flawless finishes for high-end applications.',
    longDescription:
      'A meticulous multi-stage process delivering mirror-grade and micro-textured surfaces for luxury products, automotive trim and architectural metalwork.',
    icon: Shield,
    image:
      'https://images.pexels.com/photos/8216570/pexels-photo-8216570.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Mirror-grade polishing',
      'Micro-texture options',
      'Automotive-grade clarity',
      'UV-stable topcoats',
    ],
  },
  {
    slug: 'custom-metal-coating',
    name: 'Custom Metal Coating',
    shortName: 'Custom',
    description: 'Bespoke coatings engineered to spec.',
    longDescription:
      'From concept to production, we develop custom coating formulations matched to your exact colour, texture and performance requirements.',
    icon: Wrench,
    image:
      'https://images.pexels.com/photos/8216580/pexels-photo-8216580.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Custom colour matching',
      'Tailored performance specs',
      'Prototype to production',
      'Technical consultation',
    ],
  },
  {
    slug: 'architectural-metal-finishes',
    name: 'Architectural Metal Finishes',
    shortName: 'Architectural',
    description: 'Large-format finishes for buildings.',
    longDescription:
      'Premium coatings for facades, cladding, railings and architectural metalwork — engineered to perform in exterior environments while retaining their finish for decades.',
    icon: Building2,
    image:
      'https://images.pexels.com/photos/8216588/pexels-photo-8216588.jpeg?auto=compress&cs=tinysrgb&w=1200',
    features: [
      'Exterior-grade durability',
      'Large-format capability',
      'Weather & UV resistance',
      'Project-scale capacity',
    ],
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
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Specification',
    description:
      'Our team develops a precise coating specification — finish, colour, texture and durability targets.',
    icon: Layers,
  },
  {
    step: '03',
    title: 'Surface Preparation',
    description:
      'Meticulous cleaning, stripping and pre-treatment to ensure a flawless, long-lasting bond.',
    icon: Brush,
  },
  {
    step: '04',
    title: 'Application',
    description:
      'Coatings applied in a controlled environment using calibrated equipment for uniform coverage.',
    icon: Shield,
  },
  {
    step: '05',
    title: 'Quality Inspection',
    description:
      'Every piece is inspected against our quality standards before it leaves the workshop.',
    icon: Wrench,
  },
];

export const instagramPosts: InstagramPost[] = [
  {
    id: 'ig1',
    type: 'reel',
    category: 'Recent Work',
    image:
      'https://images.pexels.com/photos/8216549/pexels-photo-8216549.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Brass coating in progress — watch the transformation.',
  },
  {
    id: 'ig2',
    type: 'post',
    category: 'Product',
    image:
      'https://images.pexels.com/photos/6585608/pexels-photo-6585608.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'New arrival: the Onyx sculptural vase.',
  },
  {
    id: 'ig3',
    type: 'reel',
    category: 'Workshop',
    image:
      'https://images.pexels.com/photos/8216570/pexels-photo-8216570.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Inside the workshop — surface finishing detail.',
  },
  {
    id: 'ig4',
    type: 'post',
    category: 'Behind The Scenes',
    image:
      'https://images.pexels.com/photos/8216554/pexels-photo-8216554.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Hand-applied patina on a custom commission.',
  },
  {
    id: 'ig5',
    type: 'reel',
    category: 'Recent Work',
    image:
      'https://images.pexels.com/photos/8216580/pexels-photo-8216580.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Architectural finish — facade panel reveal.',
  },
  {
    id: 'ig6',
    type: 'post',
    category: 'Product',
    image:
      'https://images.pexels.com/photos/6585591/pexels-photo-6585591.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Gold cutlery set — PVD finish, built to last.',
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
    icon: Sparkles,
    title: 'Craftsmanship First',
    description:
      'Every product and finish is the result of obsessive attention to material, detail and craft.',
  },
  {
    icon: Shield,
    title: 'Built to Last',
    description:
      'Coatings engineered for decades of performance. Products made to be lived with, not replaced.',
  },
  {
    icon: Building2,
    title: 'Trade & Commercial Ready',
    description:
      'Trusted by architects, designers and builders for projects of any scale.',
  },
  {
    icon: Wrench,
    title: 'Bespoke Capability',
    description:
      'From a single statement piece to full production runs, we tailor every detail to your brief.',
  },
];
