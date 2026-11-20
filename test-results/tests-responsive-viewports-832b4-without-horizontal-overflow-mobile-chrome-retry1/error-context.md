# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\responsive-viewports.spec.ts >> responsive: interactive states >> mobile menu opens and closes without horizontal overflow
- Location: tests\responsive-viewports.spec.ts:88:7

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /close|menu/i }).first()
    - locator resolved to <button aria-label="Open menu" class="jsx-3692745801 flex h-11 w-11 items-center justify-center rounded-full lg:hidden">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M18 6 6 18"></path> from <div class="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col lg:hidden">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M18 6 6 18"></path> from <div class="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col lg:hidden">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    28 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <path d="M18 6 6 18"></path> from <div class="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col lg:hidden">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - navigation [ref=e3]:
      - link "RT Metal Coating — Home" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "RT Metal Coating" [ref=e5]
      - button "Open menu" [active] [ref=e6] [cursor=pointer]
  - generic [ref=e9]:
    - generic [ref=e10]:
      - img "RTMETALCOATING" [ref=e12]
      - button "Close menu" [ref=e13] [cursor=pointer]
    - generic [ref=e17]:
      - paragraph [ref=e18]: Menu
      - list [ref=e19]:
        - listitem [ref=e20]:
          - link "Home" [ref=e21] [cursor=pointer]:
            - /url: /
        - listitem [ref=e22]:
          - link "Home Decor" [ref=e23] [cursor=pointer]:
            - /url: /home-decor
        - listitem [ref=e24]:
          - link "Metal Services" [ref=e25] [cursor=pointer]:
            - /url: /metal-coating
        - listitem [ref=e26]:
          - link "Gallery" [ref=e27] [cursor=pointer]:
            - /url: /before-after
        - listitem [ref=e28]:
          - link "About" [ref=e29] [cursor=pointer]:
            - /url: /about
        - listitem [ref=e30]:
          - link "Contact" [ref=e31] [cursor=pointer]:
            - /url: /#contact
        - listitem [ref=e32]:
          - link "Sign In / Sign Up" [ref=e33] [cursor=pointer]:
            - /url: /login
      - paragraph [ref=e34]: Collections
      - list [ref=e35]:
        - listitem [ref=e36]:
          - link "Sculptures & Figurines" [ref=e37] [cursor=pointer]:
            - /url: /home-decor/category/sculptures-figurines
        - listitem [ref=e38]:
          - link "Lighting & Wall Decor" [ref=e39] [cursor=pointer]:
            - /url: /home-decor/category/lighting-wall-decor
      - paragraph [ref=e40]: Metal Services
      - list [ref=e41]:
        - listitem [ref=e42]:
          - link "PVD Coating" [ref=e43] [cursor=pointer]:
            - /url: /metal-coating/pvd-coating
        - listitem [ref=e44]:
          - link "Electroplating" [ref=e45] [cursor=pointer]:
            - /url: /metal-coating/electroplating
        - listitem [ref=e46]:
          - link "PU Coating" [ref=e47] [cursor=pointer]:
            - /url: /metal-coating/pu-coating
        - listitem [ref=e48]:
          - link "Powder Coating" [ref=e49] [cursor=pointer]:
            - /url: /metal-coating/powder-coating
        - listitem [ref=e50]:
          - link "Decorative Metal Finishing" [ref=e51] [cursor=pointer]:
            - /url: /metal-coating/decorative-metal-finishing
        - listitem [ref=e52]:
          - link "Metal Restoration & Refinishing" [ref=e53] [cursor=pointer]:
            - /url: /metal-coating/metal-restoration
      - link "View Metal Collections" [ref=e54] [cursor=pointer]:
        - /url: /metal-coating#collections
    - button "Chat on WhatsApp" [ref=e56] [cursor=pointer]
  - main [ref=e59]:
    - region "RT Metals hero section" [ref=e60]:
      - generic [ref=e62]:
        - img "Professional metal coating process in workshop" [ref=e64]
        - img "Premium brass architectural interior with metal accents" [ref=e66]
      - generic [ref=e67]:
        - paragraph [ref=e68]: RT Metals / Metal Finishing & Decorative Solutions
        - heading "Metal Finishes for a Better Tomorrow." [level=1] [ref=e70]: Metal Finishesfor a BetterTomorrow.
        - paragraph [ref=e71]: RT Metals delivers premium metal coating and decorative metal solutions for modern spaces — built to last, crafted to impress.
        - generic [ref=e72]:
          - link "Explore Our Solutions" [ref=e73] [cursor=pointer]:
            - /url: /metal-coating
          - link "View Our Work" [ref=e76] [cursor=pointer]:
            - /url: /home-decor
        - generic "Trust indicators" [ref=e79]:
          - generic [ref=e80]: Premium Quality Finishes
          - generic [ref=e84]: Wide Range of Metals & Coatings
          - generic [ref=e89]: Custom Solutions for Every Project
          - generic [ref=e93]: Trusted by Businesses & Designers
    - generic [ref=e102]:
      - 'link "METAL COATING & SURFACE FINISHING: Metal Coating for Every Industry" [ref=e104] [cursor=pointer]':
        - /url: /metal-coating
        - img "Professional metal coating industrial workshop" [ref=e105]
        - generic [ref=e108]:
          - paragraph [ref=e109]: METAL COATING & SURFACE FINISHING
          - heading "Metal Coating for Every Industry" [level=3] [ref=e110]
          - paragraph [ref=e111]: Surface finishing and restoration for industrial components, architectural details and custom applications.
          - list "METAL COATING & SURFACE FINISHING services" [ref=e112]:
            - listitem [ref=e113]: Metal Coating & Surface Treatment
            - listitem [ref=e115]: Furniture & Industrial Coating
            - listitem [ref=e117]: Restoration & Polishing
            - listitem [ref=e119]: Art Piece Finishing
          - generic [ref=e121]: Explore Metal Coating
      - 'link "HOME DÉCOR & METAL ART: Metal Art & Decorative Interiors" [ref=e125] [cursor=pointer]':
        - /url: /home-decor
        - img "Premium decorative metal art pieces" [ref=e126]
        - generic [ref=e129]:
          - paragraph [ref=e130]: HOME DÉCOR & METAL ART
          - heading "Metal Art & Decorative Interiors" [level=3] [ref=e131]
          - paragraph [ref=e132]: Explore decorative objects, statement pieces and custom metal accents for homes and interiors.
          - list "HOME DÉCOR & METAL ART services" [ref=e133]:
            - listitem [ref=e134]: Sculptures & Decorative Objects
            - listitem [ref=e136]: Table & Wall Décor
            - listitem [ref=e138]: Accent & Statement Pieces
            - listitem [ref=e140]: Gifting & Decorative Collections
          - generic [ref=e142]: Explore Home Décor
    - region "Materials and surfaces" [ref=e145]:
      - generic [ref=e147]:
        - generic [ref=e148]:
          - paragraph [ref=e149]: Materials & Surfaces
          - heading "Materials. Finishes. Possibilities." [level=2] [ref=e151]: Materials.Finishes.Possibilities.
          - paragraph [ref=e152]: Explore the materials we work with, from iron and brass to wood and specialty surfaces, with finishes suited to different applications.
          - link "Explore all materials" [ref=e153] [cursor=pointer]:
            - /url: /metal-coating
            - text: Explore Materials
        - generic [ref=e156]:
          - list "Materials gallery" [ref=e157]:
            - listitem [ref=e158]:
              - img "Raw cast iron texture and surface detail" [ref=e160]
              - paragraph [ref=e162]: Iron
            - listitem [ref=e163]:
              - img "Polished stainless steel sheet surface" [ref=e165]
              - paragraph [ref=e167]: Steel
            - listitem [ref=e168]:
              - img "Brushed aluminium panel with coating finish" [ref=e170]
              - paragraph [ref=e172]: Aluminium
            - listitem [ref=e173]:
              - img "Warm golden brass metallic surface and finish" [ref=e175]
              - paragraph [ref=e177]: Brass
            - listitem [ref=e178]:
              - img "Natural wood grain with metal inlay detail" [ref=e180]
              - paragraph [ref=e182]: Wood
            - listitem [ref=e183]:
              - img "PVC panel material surface for coating" [ref=e185]
              - paragraph [ref=e187]: PVC
          - paragraph [ref=e188]: Scroll horizontally to explore all materials
    - region "Metal surface finishing comparison" [ref=e189]:
      - generic [ref=e191]:
        - generic [ref=e193]:
          - generic [ref=e194]: Metal Finishing / Visual Comparison
          - heading [level=2] [ref=e197]:
            - text: The Difference
            - generic [ref=e198]:
              - text: Is in the
              - emphasis [ref=e199]: Finish.
          - paragraph [ref=e200]: From surface preparation to decorative finishing, explore the range of appearances possible with metal coating and restoration services.
          - generic [ref=e201]:
            - link "Explore Metal Services" [ref=e202] [cursor=pointer]:
              - /url: /metal-coating
            - link "View All Transformations" [ref=e205] [cursor=pointer]:
              - /url: /before-after
        - generic [ref=e209]:
          - generic [ref=e211]:
            - generic: Worn Surface
            - generic: Decorative Finish
            - slider "Compare worn and decorative metal surfaces" [ref=e212]: "50"
          - generic [ref=e213]:
            - paragraph [ref=e214]:
              - generic [ref=e217]: Finishing
            - generic [ref=e218]: Slide to Compare
    - region [ref=e222]:
      - generic [ref=e224]:
        - generic [ref=e227]:
          - paragraph [ref=e230]: Our Process
          - heading "From Requirement to Finished Surface." [level=2] [ref=e231]
          - paragraph [ref=e232]: Every project starts with understanding the material, intended application and required finish. Our approach focuses on defining the scope, preparing the surface and reviewing the finished work.
          - generic [ref=e233]:
            - generic [ref=e234]:
              - img "Illustrative photograph of metal finishing work" [ref=e235]
              - generic [ref=e236]: Surface Finishing
            - paragraph [ref=e239]: Illustrative workshop imagery.
          - link "Discuss Your Project" [ref=e240] [cursor=pointer]:
            - /url: /#contact
        - generic [ref=e246]:
          - generic [ref=e247]:
            - generic [ref=e248]: "01"
            - generic [ref=e249]:
              - heading "Discuss the Project" [level=3] [ref=e250]
              - paragraph [ref=e251]: Share your material, dimensions, finish reference and project requirements.
          - generic [ref=e252]:
            - generic [ref=e253]: "02"
            - generic [ref=e254]:
              - heading "Confirm the Specification" [level=3] [ref=e255]
              - paragraph [ref=e256]: Review suitable finishing options and agree on the project scope.
          - generic [ref=e257]:
            - generic [ref=e258]: "03"
            - generic [ref=e259]:
              - heading "Surface Preparation" [level=3] [ref=e260]
              - paragraph [ref=e261]: Prepare the metal according to its condition and the selected finishing process.
          - generic [ref=e262]:
            - generic [ref=e263]: "04"
            - generic [ref=e264]:
              - heading "Coating & Finishing" [level=3] [ref=e265]
              - paragraph [ref=e266]: Carry out the agreed surface treatment or decorative finishing work.
          - generic [ref=e267]:
            - generic [ref=e268]: "05"
            - generic [ref=e269]:
              - heading "Inspection & Handover" [level=3] [ref=e270]
              - paragraph [ref=e271]: Review the completed work against the agreed requirements before handover.
    - generic [ref=e273]:
      - generic [ref=e274]:
        - generic [ref=e275]:
          - paragraph [ref=e276]: The Collection
          - heading "Featured products" [level=2] [ref=e277]
          - paragraph [ref=e278]: A selection of pieces that define the RTMETALCOATING aesthetic — material-led, quietly confident and built to last.
        - link "View all" [ref=e279] [cursor=pointer]:
          - /url: /home-decor
      - generic [ref=e282]:
        - generic [ref=e284]:
          - generic [ref=e285]:
            - img "Ashok Stambh – Premium Decorative Showpiece" [ref=e286]
            - generic [ref=e287]: Bestseller
            - button "Add to wishlist" [ref=e288] [cursor=pointer]
            - generic [ref=e291]:
              - link "View Details" [ref=e292] [cursor=pointer]:
                - /url: /home-decor/ashok-stambh-premium-decorative-showpiece
              - button "Quick view" [ref=e293] [cursor=pointer]
          - generic [ref=e297]:
            - link [ref=e299] [cursor=pointer]:
              - /url: /home-decor/ashok-stambh-premium-decorative-showpiece
              - heading "Ashok Stambh – Premium Decorative Showpiece" [level=3] [ref=e300]
            - generic [ref=e301]:
              - generic [ref=e302]:
                - generic [ref=e303]: Finish
                - generic [ref=e304]: Gold
              - group "Select a finish for Ashok Stambh – Premium Decorative Showpiece" [ref=e305]:
                - button "Gold" [pressed] [ref=e306] [cursor=pointer]
                - button "Silver" [ref=e313] [cursor=pointer]
                - button "Antique Bronze" [ref=e318] [cursor=pointer]:
                  - generic [ref=e322]: Bronze
            - generic [ref=e324]:
              - button "Enquire on WhatsApp" [ref=e325] [cursor=pointer]
              - link "Enquire Now" [ref=e328] [cursor=pointer]:
                - /url: /?product=e01e4bdc-89a8-46f7-beef-8ab4a3be6779&productName=Ashok+Stambh+%E2%80%93+Premium+Decorative+Showpiece&variant=240e9e7d-3b7a-41a2-84c6-cd24d48a31f9&finish=Gold&sku=ASHOK-STG-GLD#contact
        - generic [ref=e332]:
          - generic [ref=e333]:
            - img "Chhatrapati Shivaji Maharaj Style Devotional Figurine" [ref=e334]
            - button "Add to wishlist" [ref=e335] [cursor=pointer]
            - generic [ref=e338]:
              - link "View Details" [ref=e339] [cursor=pointer]:
                - /url: /home-decor/chhatrapati-shivaji-maharaj-style-devotional-figurine
              - button "Quick view" [ref=e340] [cursor=pointer]
          - generic [ref=e344]:
            - link [ref=e346] [cursor=pointer]:
              - /url: /home-decor/chhatrapati-shivaji-maharaj-style-devotional-figurine
              - heading "Chhatrapati Shivaji Maharaj Style Devotional Figurine" [level=3] [ref=e347]
            - generic [ref=e349]:
              - button "Enquire on WhatsApp" [ref=e350] [cursor=pointer]
              - link "Enquire Now" [ref=e353] [cursor=pointer]:
                - /url: /?product=69e90ff0-cb67-490c-aefc-4816ac3bfc1c&productName=Chhatrapati+Shivaji+Maharaj+Style+Devotional+Figurine#contact
        - generic [ref=e357]:
          - generic [ref=e358]:
            - img "Seated Lord Shiva Decorative Idol" [ref=e359]
            - button "Add to wishlist" [ref=e360] [cursor=pointer]
            - generic [ref=e363]:
              - link "View Details" [ref=e364] [cursor=pointer]:
                - /url: /home-decor/seated-lord-shiva-decorative-idol
              - button "Quick view" [ref=e365] [cursor=pointer]
          - generic [ref=e369]:
            - link [ref=e371] [cursor=pointer]:
              - /url: /home-decor/seated-lord-shiva-decorative-idol
              - heading "Seated Lord Shiva Decorative Idol" [level=3] [ref=e372]
            - generic [ref=e374]:
              - button "Enquire on WhatsApp" [ref=e375] [cursor=pointer]
              - link "Enquire Now" [ref=e378] [cursor=pointer]:
                - /url: /?product=8ee91520-22f4-4bab-88d8-8985a14eb4fc&productName=Seated+Lord+Shiva+Decorative+Idol#contact
        - generic [ref=e382]:
          - generic [ref=e383]:
            - img "Premium Leopard Sculpture – Decorative Showpiece" [ref=e384]
            - generic [ref=e385]: Bestseller
            - button "Add to wishlist" [ref=e386] [cursor=pointer]
            - generic [ref=e389]:
              - link "View Details" [ref=e390] [cursor=pointer]:
                - /url: /home-decor/premium-leopard-sculpture-showpiece
              - button "Quick view" [ref=e391] [cursor=pointer]
          - generic [ref=e395]:
            - link [ref=e397] [cursor=pointer]:
              - /url: /home-decor/premium-leopard-sculpture-showpiece
              - heading "Premium Leopard Sculpture – Decorative Showpiece" [level=3] [ref=e398]
            - generic [ref=e399]:
              - generic [ref=e400]:
                - generic [ref=e401]: Finish
                - generic [ref=e402]: Gold Finish
              - group "Select a finish for Premium Leopard Sculpture – Decorative Showpiece" [ref=e403]:
                - button "Gold Finish" [pressed] [ref=e404] [cursor=pointer]:
                  - generic [ref=e410]: Gold
                - button "Silver Mirror Finish" [ref=e411] [cursor=pointer]:
                  - generic [ref=e415]: Silver
                - button "Antique Bronze Finish" [ref=e416] [cursor=pointer]:
                  - generic [ref=e420]: Bronze
                - button "Black Finish" [ref=e421] [cursor=pointer]:
                  - generic [ref=e425]: Black
            - generic [ref=e427]:
              - button "Enquire on WhatsApp" [ref=e428] [cursor=pointer]
              - link "Enquire Now" [ref=e431] [cursor=pointer]:
                - /url: /?product=d8ec98cd-031e-4600-bab6-c0aa820a9efe&productName=Premium+Leopard+Sculpture+%E2%80%93+Decorative+Showpiece&variant=415771bf-6a5c-4201-a15a-3bc80dfb3e62&finish=Gold+Finish#contact
    - generic [ref=e436]:
      - generic [ref=e438]:
        - paragraph [ref=e439]: METAL COATING & FINISHING
        - heading "Surface Finishing, & Finishing" [level=2] [ref=e440]
        - paragraph [ref=e441]: Coating, refinishing and decorative surface finishes for metal components, fabrication work and custom projects. Explore our services and finish samples, or share your requirements for a quotation.
        - generic [ref=e442]:
          - link "Explore Our Services" [ref=e443] [cursor=pointer]:
            - /url: /metal-coating
          - link "Enquire About a Project" [ref=e446] [cursor=pointer]:
            - /url: /metal-coating#quote
      - generic [ref=e449]:
        - link "PVD Coating — view service" [ref=e451] [cursor=pointer]:
          - /url: /metal-coating/pvd-coating
          - generic [ref=e457]:
            - heading "PVD Coating" [level=3] [ref=e458]
            - paragraph [ref=e459]: Thin-film surface finishing for selected decorative components, with an emphasis on appearance, sheen and substrate compatibility.
        - link "Electroplating — view service" [ref=e461] [cursor=pointer]:
          - /url: /metal-coating/electroplating
          - generic [ref=e466]:
            - heading "Electroplating" [level=3] [ref=e467]
            - paragraph [ref=e468]: Electrochemical metal finishing for components requiring a specified decorative or functional surface layer.
        - link "PU Coating — view service" [ref=e470] [cursor=pointer]:
          - /url: /metal-coating/pu-coating
          - generic [ref=e476]:
            - heading "PU Coating" [level=3] [ref=e477]
            - paragraph [ref=e478]: Polyurethane-based surface finishing for suitable components where appearance and protective coating requirements are important.
        - link "Powder Coating — view service" [ref=e480] [cursor=pointer]:
          - /url: /metal-coating/powder-coating
          - generic [ref=e486]:
            - heading "Powder Coating" [level=3] [ref=e487]
            - paragraph [ref=e488]: Dry-powder surface finishing for suitable components, using coating application and controlled curing.
        - link "Decorative Metal Finishing — view service" [ref=e490] [cursor=pointer]:
          - /url: /metal-coating/decorative-metal-finishing
          - generic [ref=e496]:
            - heading "Decorative Metal Finishing" [level=3] [ref=e497]
            - paragraph [ref=e498]: Appearance-focused metal surface treatments for decorative, architectural and interior applications.
        - link "Metal Restoration & Refinishing — view service" [ref=e500] [cursor=pointer]:
          - /url: /metal-coating/metal-restoration
          - generic [ref=e506]:
            - heading "Metal Restoration & Refinishing" [level=3] [ref=e507]
            - paragraph [ref=e508]: Assessment, surface preparation and refinishing of worn or aged metal components.
    - generic [ref=e510]:
      - generic [ref=e511]:
        - paragraph [ref=e512]: OUR WORK IN MOTION
        - heading "Craftsmanship in Every Detail" [level=2] [ref=e513]
        - paragraph [ref=e514]: Explore real projects, premium finishes and workshop craftsmanship through our latest videos.
      - generic [ref=e515]:
        - button "Previous reel" [disabled]
        - generic "Instagram reels carousel" [ref=e516]:
          - generic [ref=e517]:
            - generic [ref=e518]:
              - button [ref=e519] [cursor=pointer]
              - generic [ref=e520]: "@rtmetalcoating"
              - paragraph [ref=e525]: Workshop Reel 01
            - generic [ref=e526]:
              - button [ref=e527] [cursor=pointer]
              - generic [ref=e528]: "@rtmetalcoating"
              - paragraph [ref=e533]: Workshop Reel 02
            - generic [ref=e534]:
              - button [ref=e535] [cursor=pointer]
              - generic [ref=e536]: "@rtmetalcoating"
              - paragraph [ref=e541]: Workshop Reel 03
            - generic [ref=e542]:
              - button [ref=e543] [cursor=pointer]
              - generic [ref=e544]: "@rtmetalcoating"
              - paragraph [ref=e549]: Workshop Reel 04
            - generic [ref=e550]:
              - button [ref=e551] [cursor=pointer]
              - generic [ref=e552]: "@rtmetalcoating"
              - paragraph [ref=e557]: Workshop Reel 05
            - generic [ref=e558]:
              - button [ref=e559] [cursor=pointer]
              - generic [ref=e560]: "@rtmetalcoating"
              - paragraph [ref=e565]: Workshop Reel 06
            - generic [ref=e566]:
              - button [ref=e567] [cursor=pointer]
              - generic [ref=e568]: "@rtmetalcoating"
              - paragraph [ref=e573]: Workshop Reel 07
        - button "Next reel" [ref=e574] [cursor=pointer]
      - link "Follow Our Work on Instagram" [ref=e578] [cursor=pointer]:
        - /url: https://www.instagram.com/rtmetalcoating/
    - generic [ref=e583]:
      - generic [ref=e584]:
        - paragraph [ref=e585]: Get in touch
        - heading "Let's start a conversation." [level=2] [ref=e586]
        - paragraph [ref=e587]: Whether it is a product enquiry, a coating brief or a full project — tell us what you have in mind.
      - generic [ref=e588]:
        - generic [ref=e590]:
          - generic [ref=e591]:
            - heading "Contact details" [level=3] [ref=e592]
            - paragraph [ref=e593]: Prefer to reach out directly? We are here Monday to Saturday, 10am to 7pm.
          - list [ref=e594]:
            - listitem [ref=e595]:
              - generic [ref=e600]:
                - paragraph [ref=e601]: Studio
                - paragraph [ref=e602]: Compound No. 194, 6th Lane, Kumbharwada, Near Trimbak Parshuram Street, Near Public Toilet, Mumbai, Maharashtra – 400004, India.
            - listitem [ref=e603]:
              - generic [ref=e607]:
                - paragraph [ref=e608]: Phone
                - generic [ref=e609]: +91 76660 67782
            - listitem [ref=e610]:
              - generic [ref=e615]:
                - paragraph [ref=e616]: Email
                - generic [ref=e617]: rtmetalservice@gmail.com
          - button "Chat on WhatsApp" [ref=e618] [cursor=pointer]
        - generic [ref=e622]:
          - generic [ref=e623]:
            - generic [ref=e624]:
              - generic [ref=e625]: Name *
              - textbox "Name *" [ref=e626]:
                - /placeholder: Your name
            - generic [ref=e627]:
              - generic [ref=e628]: Mobile Number *
              - textbox "Mobile Number *" [ref=e629]:
                - /placeholder: +91 98765 43210
            - generic [ref=e630]:
              - generic [ref=e631]: Email (optional)
              - textbox "Email (optional)" [ref=e632]:
                - /placeholder: you@email.com
          - generic [ref=e633]:
            - generic [ref=e634]: I am interested in
            - combobox [ref=e635]:
              - option "Home Decor & Lifestyle Products" [selected]
              - option "Metal Coating Services"
              - option "Custom / Bespoke Project"
              - option "Trade & Bulk Enquiry"
          - generic [ref=e636]:
            - generic [ref=e637]: Message
            - textbox "Tell us about your project..." [ref=e638]
          - button "Send Enquiry" [ref=e639] [cursor=pointer]
    - generic [ref=e645]:
      - paragraph [ref=e646]: Ready when you are
      - heading "Let's build something lasting." [level=2] [ref=e647]
      - paragraph [ref=e648]: Explore the collection or request a quote for premium metal coating — we will respond within one business day.
      - generic [ref=e649]:
        - link "Shop Home Decor" [ref=e650] [cursor=pointer]:
          - /url: /home-decor
        - link "Metal Coating Services" [ref=e653] [cursor=pointer]:
          - /url: /metal-coating
  - contentinfo [ref=e654]:
    - generic [ref=e655]:
      - generic [ref=e656]:
        - generic [ref=e657]:
          - link "RTMETALCOATING homepage" [ref=e658] [cursor=pointer]:
            - /url: /
            - img "RTMETALCOATING" [ref=e660]
          - paragraph [ref=e661]: Metal coating, surface finishing and decorative products for residential, commercial and architectural projects.
          - generic [ref=e662]:
            - generic [ref=e663]:
              - paragraph [ref=e664]: RTMETALCOATING
              - paragraph [ref=e665]:
                - text: Metal Coating & Decorative Finishing Services
                - generic [ref=e666]: Mumbai, Maharashtra, India
            - generic [ref=e667]:
              - paragraph [ref=e668]: RT HOME DECOR
              - paragraph [ref=e669]:
                - text: Online Home Decoration Store
                - generic [ref=e670]: Wai, Satara, Maharashtra, India
          - generic [ref=e671]:
            - link "Instagram" [ref=e672] [cursor=pointer]:
              - /url: https://www.instagram.com/rtmetalcoating/
            - button "WhatsApp" [ref=e676] [cursor=pointer]
            - button "Email contact pending" [disabled] [ref=e679]
        - generic [ref=e684]:
          - generic [ref=e685]:
            - generic [ref=e686]:
              - heading "Collections" [level=3] [ref=e687]
              - list [ref=e688]:
                - listitem [ref=e689]:
                  - link "Home Decor" [ref=e690] [cursor=pointer]:
                    - /url: /home-decor?category=home-decor
                - listitem [ref=e695]:
                  - link "Decorative Accessories" [ref=e696] [cursor=pointer]:
                    - /url: /home-decor?category=decorative-accessories
                - listitem [ref=e701]:
                  - link "Gift Articles" [ref=e702] [cursor=pointer]:
                    - /url: /home-decor?category=gift-articles
                - listitem [ref=e707]:
                  - link "Lifestyle Products" [ref=e708] [cursor=pointer]:
                    - /url: /home-decor?category=lifestyle-products
                - listitem [ref=e713]:
                  - link "Household Products" [ref=e714] [cursor=pointer]:
                    - /url: /home-decor?category=household-products
                - listitem [ref=e719]:
                  - link "Daily Utility" [ref=e720] [cursor=pointer]:
                    - /url: /home-decor?category=daily-utility
            - generic [ref=e725]:
              - heading "Services" [level=3] [ref=e726]
              - list [ref=e727]:
                - listitem [ref=e728]:
                  - link "MS Coating" [ref=e729] [cursor=pointer]:
                    - /url: /metal-coating#ms-coating
                - listitem [ref=e734]:
                  - link "Brass Coating" [ref=e735] [cursor=pointer]:
                    - /url: /metal-coating#brass-coating
                - listitem [ref=e740]:
                  - link "Decorative Finishing" [ref=e741] [cursor=pointer]:
                    - /url: /metal-coating#decorative-metal-finishing
                - listitem [ref=e746]:
                  - link "Premium Surface Finishing" [ref=e747] [cursor=pointer]:
                    - /url: /metal-coating#premium-surface-finishing
                - listitem [ref=e752]:
                  - link "Custom Metal Coating" [ref=e753] [cursor=pointer]:
                    - /url: /metal-coating#custom-metal-coating
                - listitem [ref=e758]:
                  - link "Architectural Finishes" [ref=e759] [cursor=pointer]:
                    - /url: /metal-coating#architectural-metal-finishes
            - generic [ref=e764]:
              - heading "Company" [level=3] [ref=e765]
              - list [ref=e766]:
                - listitem [ref=e767]:
                  - link "About" [ref=e768] [cursor=pointer]:
                    - /url: /about
                - listitem [ref=e773]:
                  - link "Before & After" [ref=e774] [cursor=pointer]:
                    - /url: /before-after
                - listitem [ref=e779]:
                  - link "Our Process" [ref=e780] [cursor=pointer]:
                    - /url: /#process
                - listitem [ref=e785]:
                  - link "Testimonials" [ref=e786] [cursor=pointer]:
                    - /url: /#testimonials
                - listitem [ref=e791]:
                  - link "Contact" [ref=e792] [cursor=pointer]:
                    - /url: /#contact
          - generic [ref=e797]:
            - generic [ref=e798]:
              - heading "Get in Touch" [level=3] [ref=e799]
              - list [ref=e800]:
                - listitem [ref=e801]:
                  - generic [ref=e805]: Compound No. 194, 6th Lane, Kumbharwada, Near Trimbak Parshuram Street, Near Public Toilet, Mumbai, Maharashtra – 400004, India.
                - listitem [ref=e806]:
                  - generic [ref=e809]: +91 76660 67782
                - listitem [ref=e810]:
                  - generic [ref=e814]: rtmetalservice@gmail.com
            - generic [ref=e815]:
              - generic [ref=e816]:
                - paragraph [ref=e817]: Metal Coating Location
                - heading "Find Us in Mumbai" [level=3] [ref=e821]
                - paragraph [ref=e822]: Kumbharwada, Mumbai 400004
              - link "View on Google Maps" [ref=e826] [cursor=pointer]:
                - /url: https://maps.app.goo.gl/wtmGuotpv7b35y8W6
      - generic [ref=e835]:
        - paragraph [ref=e836]: © 2026 RTMETALCOATING. All rights reserved.
        - generic [ref=e837]:
          - link "Privacy" [ref=e838] [cursor=pointer]:
            - /url: /
          - link "Terms" [ref=e840] [cursor=pointer]:
            - /url: /
  - alert [ref=e841]
```

# Test source

```ts
  2   | 
  3   | // Viewport widths required for acceptance: 320, 360, 375, 390, 414, 768, 1024, 1280, 1440 px
  4   | const VIEWPORTS = [
  5   |   { width: 320, height: 844, label: '320px' },
  6   |   { width: 360, height: 844, label: '360px' },
  7   |   { width: 375, height: 844, label: '375px' },
  8   |   { width: 390, height: 844, label: '390px' },
  9   |   { width: 414, height: 896, label: '414px' },
  10  |   { width: 768, height: 1024, label: '768px' },
  11  |   { width: 1024, height: 768, label: '1024px' },
  12  |   { width: 1280, height: 800, label: '1280px' },
  13  |   { width: 1440, height: 900, label: '1440px' },
  14  | ];
  15  | 
  16  | // Public routes that return 200 in the current staging database.
  17  | // '/home-decor/category/decorative-accessories' and '/home-decor/onyx-sculptural-vase'
  18  | // previously used here both return 404 (Supabase-authoritative mode, static
  19  | // fallback disabled) and are replaced with routes that load.
  20  | const ROUTES = [
  21  |   { name: 'Homepage', path: '/' },
  22  |   { name: 'About Us', path: '/about' },
  23  |   { name: 'Home Decor', path: '/home-decor' },
  24  |   { name: 'Product Detail (seated-dog-figurine)', path: '/home-decor/seated-dog-figurine-grey-white-wa0006' },
  25  |   { name: 'Metal Services', path: '/metal-coating' },
  26  |   { name: 'Before & After', path: '/before-after' },
  27  |   { name: 'Product Detail (metal-p0026)', path: '/metal-coating/product/metal-p0026-abstract-continuous-line-wall-sculpture' },
  28  | ];
  29  | 
  30  | function overflowCheck(viewportWidth: number) {
  31  |   return () => {
  32  |     const doc = document.documentElement;
  33  |     const body = document.body;
  34  |     return Math.max(0, Math.max(doc.scrollWidth, body.scrollWidth) - doc.clientWidth);
  35  |   };
  36  | }
  37  | 
  38  | for (const viewport of VIEWPORTS) {
  39  |   for (const route of ROUTES) {
  40  |     test(`responsive: ${route.name} at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
  41  |       page,
  42  |     }) => {
  43  |       await page.setViewportSize({ width: viewport.width, height: viewport.height });
  44  |       await page.goto(route.path, { waitUntil: 'domcontentloaded' });
  45  |       await page.waitForTimeout(1000);
  46  | 
  47  |       // Horizontal overflow measured against document scroll dimensions, not
  48  |       // body.getBoundingClientRect(), so an overflowing child is caught even
  49  |       // when the body itself remains viewport-width.
  50  |       const overflowPx = await page.evaluate(overflowCheck(viewport.width));
  51  |       expect(overflowPx).toBeLessThanOrEqual(1);
  52  | 
  53  |       // Structural landmarks are present (visibility of a landmark is not, by
  54  |       // itself, proof of a complete layout - it is a baseline smoke check).
  55  |       const header = page.locator('header').first();
  56  |       if (await header.count() > 0) await expect(header).toBeVisible();
  57  | 
  58  |       const footer = page.locator('footer').first();
  59  |       if (await footer.count() > 0) await expect(footer).toBeVisible();
  60  | 
  61  |       const main = page.locator('main').first();
  62  |       if (await main.count() > 0) await expect(main).toBeVisible();
  63  |     });
  64  |   }
  65  | }
  66  | 
  67  | test.describe('responsive: interactive states', () => {
  68  |   for (const viewport of VIEWPORTS) {
  69  |     test(`no horizontal overflow on Metal Services at ${viewport.label}`, async ({ page }) => {
  70  |       await page.setViewportSize({ width: viewport.width, height: viewport.height });
  71  |       await page.goto('/metal-coating', { waitUntil: 'domcontentloaded' });
  72  |       await page.waitForTimeout(1000);
  73  |       const overflowPx = await page.evaluate(overflowCheck(viewport.width));
  74  |       expect(overflowPx).toBeLessThanOrEqual(1);
  75  |     });
  76  | 
  77  |     test(`no horizontal overflow on Product Detail at ${viewport.label}`, async ({ page }) => {
  78  |       await page.setViewportSize({ width: viewport.width, height: viewport.height });
  79  |       await page.goto('/home-decor/seated-dog-figurine-grey-white-wa0006', {
  80  |         waitUntil: 'domcontentloaded',
  81  |       });
  82  |       await page.waitForTimeout(1000);
  83  |       const overflowPx = await page.evaluate(overflowCheck(viewport.width));
  84  |       expect(overflowPx).toBeLessThanOrEqual(1);
  85  |     });
  86  |   }
  87  | 
  88  |   test('mobile menu opens and closes without horizontal overflow', async ({ page }) => {
  89  |     await page.setViewportSize({ width: 375, height: 844 });
  90  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  91  |     await page.waitForTimeout(1000);
  92  | 
  93  |     const menuButton = page.getByRole('button', { name: /menu|open navigation/i }).first();
  94  |     if (await menuButton.count() > 0) {
  95  |       await menuButton.click();
  96  |       await page.waitForTimeout(500);
  97  |       const openOverflow = await page.evaluate(overflowCheck(375));
  98  |       expect(openOverflow).toBeLessThanOrEqual(1);
  99  | 
  100 |       const closeButton = page.getByRole('button', { name: /close|menu/i }).first();
  101 |       if ((await closeButton.count()) > 0) {
> 102 |         await closeButton.click();
      |                           ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  103 |         await page.waitForTimeout(500);
  104 |       }
  105 |       const closedOverflow = await page.evaluate(overflowCheck(375));
  106 |       expect(closedOverflow).toBeLessThanOrEqual(1);
  107 |     }
  108 |   });
  109 | 
  110 |   test('product finish selector and image gallery load without overflow', async ({ page }) => {
  111 |     await page.setViewportSize({ width: 375, height: 844 });
  112 |     await page.goto('/home-decor/seated-dog-figurine-grey-white-wa0006', {
  113 |       waitUntil: 'domcontentloaded',
  114 |     });
  115 |     await page.waitForTimeout(1000);
  116 | 
  117 |     const overflowPx = await page.evaluate(overflowCheck(375));
  118 |     expect(overflowPx).toBeLessThanOrEqual(1);
  119 | 
  120 |     const gallery = page.locator('[class*="gallery"], [role="region"], img').first();
  121 |     if ((await gallery.count()) > 0) await expect(gallery).toBeVisible();
  122 | 
  123 |     const finishSelect = page.getByRole('combobox').first();
  124 |     if ((await finishSelect.count()) > 0) {
  125 |       await finishSelect.click();
  126 |       await page.waitForTimeout(500);
  127 |       const afterOverflow = await page.evaluate(overflowCheck(375));
  128 |       expect(afterOverflow).toBeLessThanOrEqual(1);
  129 |     }
  130 |   });
  131 | 
  132 |   test('dialogs and quick views do not cause horizontal overflow', async ({ page }) => {
  133 |     await page.setViewportSize({ width: 375, height: 844 });
  134 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  135 |     await page.waitForTimeout(1000);
  136 | 
  137 |     const overflowPx = await page.evaluate(overflowCheck(375));
  138 |     expect(overflowPx).toBeLessThanOrEqual(1);
  139 |   });
  140 | });
  141 | 
```