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
    27 × waiting for element to be visible, enabled and stable
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
  - generic [aria-hidden]:
    - generic: Loading page
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
            - generic [ref=e298]:
              - link [ref=e299] [cursor=pointer]:
                - /url: /home-decor/ashok-stambh-premium-decorative-showpiece
                - heading "Ashok Stambh – Premium Decorative Showpiece" [level=3] [ref=e300]
              - paragraph [ref=e301]: Sculptures Figurines
              - paragraph [ref=e302]: Gold
              - generic [ref=e303]:
                - generic [ref=e304]:
                  - generic [ref=e305]: Variants
                  - generic [ref=e306]: Gold
                - group "Select a finish for Ashok Stambh – Premium Decorative Showpiece" [ref=e307]:
                  - button "Gold" [pressed] [ref=e308] [cursor=pointer]
                  - button "Silver" [ref=e315] [cursor=pointer]
                  - button "Antique Bronze" [ref=e320] [cursor=pointer]:
                    - generic [ref=e324]: Bronze
            - generic [ref=e326]:
              - button "Enquire on WhatsApp" [ref=e327] [cursor=pointer]
              - link "Enquire Now" [ref=e330] [cursor=pointer]:
                - /url: /?product=e01e4bdc-89a8-46f7-beef-8ab4a3be6779&productName=Ashok+Stambh+%E2%80%93+Premium+Decorative+Showpiece&variant=240e9e7d-3b7a-41a2-84c6-cd24d48a31f9&finish=Gold&sku=ASHOK-STG-GLD#contact
        - generic [ref=e335]:
          - generic [ref=e336]:
            - img "Chhatrapati Shivaji Maharaj Style Devotional Figurine" [ref=e337]
            - button "Add to wishlist" [ref=e338] [cursor=pointer]
            - generic [ref=e341]:
              - link "View Details" [ref=e342] [cursor=pointer]:
                - /url: /home-decor/chhatrapati-shivaji-maharaj-style-devotional-figurine
              - button "Quick view" [ref=e343] [cursor=pointer]
          - generic [ref=e347]:
            - generic [ref=e348]:
              - link [ref=e349] [cursor=pointer]:
                - /url: /home-decor/chhatrapati-shivaji-maharaj-style-devotional-figurine
                - heading "Chhatrapati Shivaji Maharaj Style Devotional Figurine" [level=3] [ref=e350]
              - paragraph [ref=e351]: Lighting Wall Decor
              - paragraph [ref=e352]: White, orange/red and dark accents
            - generic [ref=e354]:
              - button "Enquire on WhatsApp" [ref=e355] [cursor=pointer]
              - link "Enquire Now" [ref=e358] [cursor=pointer]:
                - /url: /?product=69e90ff0-cb67-490c-aefc-4816ac3bfc1c&productName=Chhatrapati+Shivaji+Maharaj+Style+Devotional+Figurine#contact
        - generic [ref=e363]:
          - generic [ref=e364]:
            - img "Seated Lord Shiva Decorative Idol" [ref=e365]
            - button "Add to wishlist" [ref=e366] [cursor=pointer]
            - generic [ref=e369]:
              - link "View Details" [ref=e370] [cursor=pointer]:
                - /url: /home-decor/seated-lord-shiva-decorative-idol
              - button "Quick view" [ref=e371] [cursor=pointer]
          - generic [ref=e375]:
            - generic [ref=e376]:
              - link [ref=e377] [cursor=pointer]:
                - /url: /home-decor/seated-lord-shiva-decorative-idol
                - heading "Seated Lord Shiva Decorative Idol" [level=3] [ref=e378]
              - paragraph [ref=e379]: Sculptures Figurines
              - paragraph [ref=e380]: Blue, yellow, orange and gold accents.
            - generic [ref=e382]:
              - button "Enquire on WhatsApp" [ref=e383] [cursor=pointer]
              - link "Enquire Now" [ref=e386] [cursor=pointer]:
                - /url: /?product=8ee91520-22f4-4bab-88d8-8985a14eb4fc&productName=Seated+Lord+Shiva+Decorative+Idol#contact
        - generic [ref=e391]:
          - generic [ref=e392]:
            - img "Premium Leopard Sculpture – Decorative Showpiece" [ref=e393]
            - generic [ref=e394]: Bestseller
            - button "Add to wishlist" [ref=e395] [cursor=pointer]
            - generic [ref=e398]:
              - link "View Details" [ref=e399] [cursor=pointer]:
                - /url: /home-decor/premium-leopard-sculpture-showpiece
              - button "Quick view" [ref=e400] [cursor=pointer]
          - generic [ref=e404]:
            - generic [ref=e405]:
              - link [ref=e406] [cursor=pointer]:
                - /url: /home-decor/premium-leopard-sculpture-showpiece
                - heading "Premium Leopard Sculpture – Decorative Showpiece" [level=3] [ref=e407]
              - paragraph [ref=e408]: Sculptures Figurines
              - paragraph [ref=e409]: Gold Finish
              - generic [ref=e410]:
                - generic [ref=e411]:
                  - generic [ref=e412]: Variants
                  - generic [ref=e413]: Gold Finish
                - group "Select a finish for Premium Leopard Sculpture – Decorative Showpiece" [ref=e414]:
                  - button "Gold Finish" [pressed] [ref=e415] [cursor=pointer]:
                    - generic [ref=e421]: Gold
                  - button "Silver Mirror Finish" [ref=e422] [cursor=pointer]:
                    - generic [ref=e426]: Silver
                  - button "Antique Bronze Finish" [ref=e427] [cursor=pointer]:
                    - generic [ref=e431]: Bronze
                  - button "Black Finish" [ref=e432] [cursor=pointer]:
                    - generic [ref=e436]: Black
            - generic [ref=e438]:
              - button "Enquire on WhatsApp" [ref=e439] [cursor=pointer]
              - link "Enquire Now" [ref=e442] [cursor=pointer]:
                - /url: /?product=d8ec98cd-031e-4600-bab6-c0aa820a9efe&productName=Premium+Leopard+Sculpture+%E2%80%93+Decorative+Showpiece&variant=415771bf-6a5c-4201-a15a-3bc80dfb3e62&finish=Gold+Finish#contact
    - generic [ref=e448]:
      - generic [ref=e450]:
        - paragraph [ref=e451]: METAL COATING & FINISHING
        - heading "Surface Finishing, & Finishing" [level=2] [ref=e452]
        - paragraph [ref=e453]: Coating, refinishing and decorative surface finishes for metal components, fabrication work and custom projects. Explore our services and finish samples, or share your requirements for a quotation.
        - generic [ref=e454]:
          - link "Explore Our Services" [ref=e455] [cursor=pointer]:
            - /url: /metal-coating
          - link "Enquire About a Project" [ref=e458] [cursor=pointer]:
            - /url: /metal-coating#quote
      - generic [ref=e461]:
        - link "PVD Coating — view service" [ref=e463] [cursor=pointer]:
          - /url: /metal-coating/pvd-coating
          - generic [ref=e469]:
            - heading "PVD Coating" [level=3] [ref=e470]
            - paragraph [ref=e471]: Thin-film surface finishing for selected decorative components, with an emphasis on appearance, sheen and substrate compatibility.
        - link "Electroplating — view service" [ref=e473] [cursor=pointer]:
          - /url: /metal-coating/electroplating
          - generic [ref=e478]:
            - heading "Electroplating" [level=3] [ref=e479]
            - paragraph [ref=e480]: Electrochemical metal finishing for components requiring a specified decorative or functional surface layer.
        - link "PU Coating — view service" [ref=e482] [cursor=pointer]:
          - /url: /metal-coating/pu-coating
          - generic [ref=e488]:
            - heading "PU Coating" [level=3] [ref=e489]
            - paragraph [ref=e490]: Polyurethane-based surface finishing for suitable components where appearance and protective coating requirements are important.
        - link "Powder Coating — view service" [ref=e492] [cursor=pointer]:
          - /url: /metal-coating/powder-coating
          - generic [ref=e498]:
            - heading "Powder Coating" [level=3] [ref=e499]
            - paragraph [ref=e500]: Dry-powder surface finishing for suitable components, using coating application and controlled curing.
        - link "Decorative Metal Finishing — view service" [ref=e502] [cursor=pointer]:
          - /url: /metal-coating/decorative-metal-finishing
          - generic [ref=e508]:
            - heading "Decorative Metal Finishing" [level=3] [ref=e509]
            - paragraph [ref=e510]: Appearance-focused metal surface treatments for decorative, architectural and interior applications.
        - link "Metal Restoration & Refinishing — view service" [ref=e512] [cursor=pointer]:
          - /url: /metal-coating/metal-restoration
          - generic [ref=e518]:
            - heading "Metal Restoration & Refinishing" [level=3] [ref=e519]
            - paragraph [ref=e520]: Assessment, surface preparation and refinishing of worn or aged metal components.
    - region "Metal products showcase" [ref=e521]:
      - generic [ref=e522]:
        - generic [ref=e523]:
          - generic [ref=e524]:
            - paragraph [ref=e525]: Our metal collection
            - heading "Explore Our Metal Products" [level=2] [ref=e526]
            - paragraph [ref=e527]: Discover metal products across our specialised categories and finishes.
          - generic [ref=e528]:
            - button "Shuffle products" [ref=e529] [cursor=pointer]: Shuffle Products
            - link "View all" [ref=e533] [cursor=pointer]:
              - /url: /metal-coating
        - paragraph [ref=e536]: Showing 24 verified metal products.
        - generic [ref=e537]:
          - heading "Metal collection" [level=3] [ref=e538]
          - region "Metal products first row" [ref=e539]:
            - generic [ref=e541]:
              - group [ref=e542]:
                - generic [ref=e543]:
                  - generic [ref=e544]:
                    - img "Western Sector Market Exterior Metal Box Signage" [ref=e545]
                    - button "Add to wishlist" [ref=e546] [cursor=pointer]
                    - generic [ref=e549]:
                      - link "View Details" [ref=e550] [cursor=pointer]:
                        - /url: /metal-coating/product/western-sector-market-exterior-metal-box-signage
                      - button "Quick view" [ref=e551] [cursor=pointer]
                  - generic [ref=e555]:
                    - generic [ref=e556]:
                      - link [ref=e557] [cursor=pointer]:
                        - /url: /metal-coating/product/western-sector-market-exterior-metal-box-signage
                        - heading "Western Sector Market Exterior Metal Box Signage" [level=3] [ref=e558]
                      - paragraph [ref=e559]: Metal Box Letters
                      - paragraph [ref=e560]: Metallic Gold / Yellow-Gold Appearance on Red Background
                    - generic [ref=e562]:
                      - link "Enquire on WhatsApp" [ref=e563] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Western%20Sector%20Market%20Exterior%20Metal%20Box%20Signage%0ACategory%3A%20Metal%20Box%20Letters%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fwestern-sector-market-exterior-metal-box-signage%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e566] [cursor=pointer]:
                        - /url: /metal-coating?product=85a18452-2a65-48a7-aeaf-3a2d93674c5a&productName=Western+Sector+Market+Exterior+Metal+Box+Signage#quote
              - group [ref=e570]:
                - generic [ref=e571]:
                  - generic [ref=e572]:
                    - img "Modern Sliding Metal & Glass Partition" [ref=e573]
                    - generic [ref=e574]: Bestseller
                    - button "Add to wishlist" [ref=e575] [cursor=pointer]
                    - generic [ref=e578]:
                      - link "View Details" [ref=e579] [cursor=pointer]:
                        - /url: /metal-coating/product/modern-sliding-metal-glass-partition
                      - button "Quick view" [ref=e580] [cursor=pointer]
                  - generic [ref=e584]:
                    - generic [ref=e585]:
                      - link [ref=e586] [cursor=pointer]:
                        - /url: /metal-coating/product/modern-sliding-metal-glass-partition
                        - heading "Modern Sliding Metal & Glass Partition" [level=3] [ref=e587]
                      - paragraph [ref=e588]: Metal Partitions Room Dividers
                      - paragraph [ref=e589]: Black / Dark bronze metal framing with transparent glass appearance
                    - generic [ref=e591]:
                      - link "Enquire on WhatsApp" [ref=e592] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Modern%20Sliding%20Metal%20%26%20Glass%20Partition%0ACategory%3A%20Metal%20Partitions%20Room%20Dividers%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmodern-sliding-metal-glass-partition%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e595] [cursor=pointer]:
                        - /url: /metal-coating?product=87f82176-3a1c-4b02-a3a8-9b5d56c366c7&productName=Modern+Sliding+Metal+%26+Glass+Partition#quote
              - group [ref=e599]:
                - generic [ref=e600]:
                  - generic [ref=e601]:
                    - img "White-Bearded Gnome Miniature Figurine" [ref=e602]
                    - button "Add to wishlist" [ref=e603] [cursor=pointer]
                    - generic [ref=e606]:
                      - link "View Details" [ref=e607] [cursor=pointer]:
                        - /url: /metal-coating/product/white-bearded-gnome-miniature-figurine
                      - button "Quick view" [ref=e608] [cursor=pointer]
                  - generic [ref=e612]:
                    - generic [ref=e613]:
                      - link [ref=e614] [cursor=pointer]:
                        - /url: /metal-coating/product/white-bearded-gnome-miniature-figurine
                        - heading "White-Bearded Gnome Miniature Figurine" [level=3] [ref=e615]
                      - paragraph [ref=e616]: Metal Plaques Panels Signage
                      - paragraph [ref=e617]: White, cream, red and pastel accents.
                    - generic [ref=e619]:
                      - link "Enquire on WhatsApp" [ref=e620] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20White-Bearded%20Gnome%20Miniature%20Figurine%0ACategory%3A%20Metal%20Plaques%20Panels%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fwhite-bearded-gnome-miniature-figurine%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e623] [cursor=pointer]:
                        - /url: /metal-coating?product=c11c3756-67d3-4900-879e-ad2964cb4b8d&productName=White-Bearded+Gnome+Miniature+Figurine#quote
              - group [ref=e627]:
                - generic [ref=e628]:
                  - generic [ref=e629]:
                    - img "Lotus-Inspired Metal Sculpture" [ref=e630]
                    - button "Add to wishlist" [ref=e631] [cursor=pointer]
                    - generic [ref=e634]:
                      - link "View Details" [ref=e635] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0031-lotus-inspired-metal-sculpture
                      - button "Quick view" [ref=e636] [cursor=pointer]
                  - generic [ref=e640]:
                    - generic [ref=e641]:
                      - link [ref=e642] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0031-lotus-inspired-metal-sculpture
                        - heading "Lotus-Inspired Metal Sculpture" [level=3] [ref=e643]
                      - paragraph [ref=e644]: Art Work
                      - paragraph [ref=e645]: Gold / Antique Gold
                    - generic [ref=e647]:
                      - link "Enquire on WhatsApp" [ref=e648] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Lotus-Inspired%20Metal%20Sculpture%0ACategory%3A%20Art%20Work%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0031-lotus-inspired-metal-sculpture%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e651] [cursor=pointer]:
                        - /url: /metal-coating?product=4332381d-9c0c-4950-b28d-d5f70cd3530b&productName=Lotus-Inspired+Metal+Sculpture#quote
              - group [ref=e655]:
                - generic [ref=e656]:
                  - generic [ref=e657]:
                    - img "Manoj Bansal Arch-Integrated Name Plate" [ref=e658]
                    - button "Add to wishlist" [ref=e659] [cursor=pointer]
                    - generic [ref=e662]:
                      - link "View Details" [ref=e663] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0089-manoj-bansal-arch-name-plate
                      - button "Quick view" [ref=e664] [cursor=pointer]
                  - generic [ref=e668]:
                    - generic [ref=e669]:
                      - link [ref=e670] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0089-manoj-bansal-arch-name-plate
                        - heading "Manoj Bansal Arch-Integrated Name Plate" [level=3] [ref=e671]
                      - paragraph [ref=e672]: Name Plates Signage
                      - paragraph [ref=e673]: Dark Bronze / Champagne Gold Appearance
                    - generic [ref=e675]:
                      - link "Enquire on WhatsApp" [ref=e676] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Manoj%20Bansal%20Arch-Integrated%20Name%20Plate%0ACategory%3A%20Name%20Plates%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0089-manoj-bansal-arch-name-plate%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e679] [cursor=pointer]:
                        - /url: /metal-coating?product=1c014521-0777-4fa2-bf93-008de83ca8b0&productName=Manoj+Bansal+Arch-Integrated+Name+Plate#quote
              - group [ref=e683]:
                - generic [ref=e684]:
                  - generic [ref=e685]:
                    - img "Intricate Patterned Metal Jali Door Grill" [ref=e686]
                    - button "Add to wishlist" [ref=e687] [cursor=pointer]
                    - generic [ref=e690]:
                      - link "View Details" [ref=e691] [cursor=pointer]:
                        - /url: /metal-coating/product/intricate-patterned-metal-jali-door-grill
                      - button "Quick view" [ref=e692] [cursor=pointer]
                  - generic [ref=e696]:
                    - generic [ref=e697]:
                      - link [ref=e698] [cursor=pointer]:
                        - /url: /metal-coating/product/intricate-patterned-metal-jali-door-grill
                        - heading "Intricate Patterned Metal Jali Door Grill" [level=3] [ref=e699]
                      - paragraph [ref=e700]: Designer Door Grills
                      - paragraph [ref=e701]: Dark bronze / Antique metallic appearance
                    - generic [ref=e703]:
                      - link "Enquire on WhatsApp" [ref=e704] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Intricate%20Patterned%20Metal%20Jali%20Door%20Grill%0ACategory%3A%20Designer%20Door%20Grills%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fintricate-patterned-metal-jali-door-grill%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e707] [cursor=pointer]:
                        - /url: /metal-coating?product=269b5bc3-68da-480c-9946-b68bbac648a2&productName=Intricate+Patterned+Metal+Jali+Door+Grill#quote
              - group [ref=e711]:
                - generic [ref=e712]:
                  - generic [ref=e713]:
                    - img "Talentia 3D Metal Letter Signage" [ref=e714]
                    - button "Add to wishlist" [ref=e715] [cursor=pointer]
                    - generic [ref=e718]:
                      - link "View Details" [ref=e719] [cursor=pointer]:
                        - /url: /metal-coating/product/talentia-3d-metal-letter-signage
                      - button "Quick view" [ref=e720] [cursor=pointer]
                  - generic [ref=e724]:
                    - generic [ref=e725]:
                      - link [ref=e726] [cursor=pointer]:
                        - /url: /metal-coating/product/talentia-3d-metal-letter-signage
                        - heading "Talentia 3D Metal Letter Signage" [level=3] [ref=e727]
                      - paragraph [ref=e728]: Metal Box Letters
                      - paragraph [ref=e729]: Champagne Gold / Brushed Gold Appearance
                    - generic [ref=e731]:
                      - link "Enquire on WhatsApp" [ref=e732] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Talentia%203D%20Metal%20Letter%20Signage%0ACategory%3A%20Metal%20Box%20Letters%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Ftalentia-3d-metal-letter-signage%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e735] [cursor=pointer]:
                        - /url: /metal-coating?product=274178dc-817a-4f63-86c4-d8ada537aba8&productName=Talentia+3D+Metal+Letter+Signage#quote
              - group [ref=e739]:
                - generic [ref=e740]:
                  - generic [ref=e741]:
                    - img "Gold Open-Shelf Architectural Divider" [ref=e742]
                    - button "Add to wishlist" [ref=e743] [cursor=pointer]
                    - generic [ref=e746]:
                      - link "View Details" [ref=e747] [cursor=pointer]:
                        - /url: /metal-coating/product/gold-open-shelf-metal-room-divider
                      - button "Quick view" [ref=e748] [cursor=pointer]
                  - generic [ref=e752]:
                    - generic [ref=e753]:
                      - link [ref=e754] [cursor=pointer]:
                        - /url: /metal-coating/product/gold-open-shelf-metal-room-divider
                        - heading "Gold Open-Shelf Architectural Divider" [level=3] [ref=e755]
                      - paragraph [ref=e756]: Metal Partitions Room Dividers
                      - paragraph [ref=e757]: Champagne gold / Light brushed metallic appearance
                    - generic [ref=e759]:
                      - link "Enquire on WhatsApp" [ref=e760] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Gold%20Open-Shelf%20Architectural%20Divider%0ACategory%3A%20Metal%20Partitions%20Room%20Dividers%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fgold-open-shelf-metal-room-divider%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e763] [cursor=pointer]:
                        - /url: /metal-coating?product=fd0343c5-fe2d-40e2-bce8-e5361ba3afe2&productName=Gold+Open-Shelf+Architectural+Divider#quote
              - group [ref=e767]:
                - generic [ref=e768]:
                  - generic [ref=e769]:
                    - img "INS Alliance LLP Corporate Information Plaque" [ref=e770]
                    - button "Add to wishlist" [ref=e771] [cursor=pointer]
                    - generic [ref=e774]:
                      - link "View Details" [ref=e775] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0150-ins-alliance-llp-information-plaque
                      - button "Quick view" [ref=e776] [cursor=pointer]
                  - generic [ref=e780]:
                    - generic [ref=e781]:
                      - link [ref=e782] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0150-ins-alliance-llp-information-plaque
                        - heading "INS Alliance LLP Corporate Information Plaque" [level=3] [ref=e783]
                      - paragraph [ref=e784]: Metal Plaques Panels Signage
                      - paragraph [ref=e785]: Champagne Gold / Brushed Gold Appearance
                    - generic [ref=e787]:
                      - link "Enquire on WhatsApp" [ref=e788] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20INS%20Alliance%20LLP%20Corporate%20Information%20Plaque%0ACategory%3A%20Metal%20Plaques%20Panels%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0150-ins-alliance-llp-information-plaque%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e791] [cursor=pointer]:
                        - /url: /metal-coating?product=e4390502-7714-44f0-ba57-5baf76012ed8&productName=INS+Alliance+LLP+Corporate+Information+Plaque#quote
              - group [ref=e795]:
                - generic [ref=e796]:
                  - generic [ref=e797]:
                    - img "Contemporary Symbolic Wall Panel" [ref=e798]
                    - generic [ref=e799]: Bestseller
                    - button "Add to wishlist" [ref=e800] [cursor=pointer]
                    - generic [ref=e803]:
                      - link "View Details" [ref=e804] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0030-contemporary-symbolic-wall-panel
                      - button "Quick view" [ref=e805] [cursor=pointer]
                  - generic [ref=e809]:
                    - generic [ref=e810]:
                      - link [ref=e811] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0030-contemporary-symbolic-wall-panel
                        - heading "Contemporary Symbolic Wall Panel" [level=3] [ref=e812]
                      - paragraph [ref=e813]: Art Work
                      - paragraph [ref=e814]: Copper / Antique Gold
                    - generic [ref=e816]:
                      - link "Enquire on WhatsApp" [ref=e817] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Contemporary%20Symbolic%20Wall%20Panel%0ACategory%3A%20Art%20Work%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0030-contemporary-symbolic-wall-panel%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e820] [cursor=pointer]:
                        - /url: /metal-coating?product=76e61b85-f072-443f-a23a-67593dabef02&productName=Contemporary+Symbolic+Wall+Panel#quote
              - group [ref=e824]:
                - generic [ref=e825]:
                  - generic [ref=e826]:
                    - img "Pooja & Kartik Shah Personalised Name Plate" [ref=e827]
                    - generic [ref=e828]: New
                    - button "Add to wishlist" [ref=e829] [cursor=pointer]
                    - generic [ref=e832]:
                      - link "View Details" [ref=e833] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0087-pooja-kartik-shah-name-plate
                      - button "Quick view" [ref=e834] [cursor=pointer]
                  - generic [ref=e838]:
                    - generic [ref=e839]:
                      - link [ref=e840] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0087-pooja-kartik-shah-name-plate
                        - heading "Pooja & Kartik Shah Personalised Name Plate" [level=3] [ref=e841]
                      - paragraph [ref=e842]: Name Plates Signage
                      - paragraph [ref=e843]: Champagne Gold / Antique Gold Appearance
                    - generic [ref=e845]:
                      - link "Enquire on WhatsApp" [ref=e846] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Pooja%20%26%20Kartik%20Shah%20Personalised%20Name%20Plate%0ACategory%3A%20Name%20Plates%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0087-pooja-kartik-shah-name-plate%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e849] [cursor=pointer]:
                        - /url: /metal-coating?product=b887bc56-7699-44aa-aad7-ca63273aecf8&productName=Pooja+%26+Kartik+Shah+Personalised+Name+Plate#quote
              - group [ref=e853]:
                - generic [ref=e854]:
                  - generic [ref=e855]:
                    - img "Arched Vertical-Bar Decorative Door Grill" [ref=e856]
                    - button "Add to wishlist" [ref=e857] [cursor=pointer]
                    - generic [ref=e860]:
                      - link "View Details" [ref=e861] [cursor=pointer]:
                        - /url: /metal-coating/product/arched-vertical-bar-decorative-door-grill
                      - button "Quick view" [ref=e862] [cursor=pointer]
                  - generic [ref=e866]:
                    - generic [ref=e867]:
                      - link [ref=e868] [cursor=pointer]:
                        - /url: /metal-coating/product/arched-vertical-bar-decorative-door-grill
                        - heading "Arched Vertical-Bar Decorative Door Grill" [level=3] [ref=e869]
                      - paragraph [ref=e870]: Designer Door Grills
                      - paragraph [ref=e871]: Dark bronze / Antique metallic finish
                    - generic [ref=e873]:
                      - link "Enquire on WhatsApp" [ref=e874] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Arched%20Vertical-Bar%20Decorative%20Door%20Grill%0ACategory%3A%20Designer%20Door%20Grills%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Farched-vertical-bar-decorative-door-grill%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e877] [cursor=pointer]:
                        - /url: /metal-coating?product=41784d81-1869-4142-914b-4ff3ef97440a&productName=Arched+Vertical-Bar+Decorative+Door+Grill#quote
            - button "Previous slide" [disabled]
            - button "Next slide" [ref=e881] [cursor=pointer]
        - generic [ref=e885]:
          - heading "Surface finishes and metal products" [level=3] [ref=e886]
          - region "Metal products second row" [ref=e887]:
            - generic [ref=e889]:
              - group [ref=e890]:
                - generic [ref=e891]:
                  - generic [ref=e892]:
                    - img "Custom Vertical Welcome & Photo Display Sign" [ref=e893]
                    - generic [ref=e894]: New
                    - button "Add to wishlist" [ref=e895] [cursor=pointer]
                    - generic [ref=e898]:
                      - link "View Details" [ref=e899] [cursor=pointer]:
                        - /url: /metal-coating/product/custom-vertical-welcome-photo-display-sign
                      - button "Quick view" [ref=e900] [cursor=pointer]
                  - generic [ref=e904]:
                    - generic [ref=e905]:
                      - link [ref=e906] [cursor=pointer]:
                        - /url: /metal-coating/product/custom-vertical-welcome-photo-display-sign
                        - heading "Custom Vertical Welcome & Photo Display Sign" [level=3] [ref=e907]
                      - paragraph [ref=e908]: Metal Box Letters
                      - paragraph [ref=e909]: Champagne Gold / Gold Metallic Appearance
                    - generic [ref=e911]:
                      - link "Enquire on WhatsApp" [ref=e912] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Custom%20Vertical%20Welcome%20%26%20Photo%20Display%20Sign%0ACategory%3A%20Metal%20Box%20Letters%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fcustom-vertical-welcome-photo-display-sign%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e915] [cursor=pointer]:
                        - /url: /metal-coating?product=b7ac188f-77d6-4e50-9d08-00dcb9ba0b22&productName=Custom+Vertical+Welcome+%26+Photo+Display+Sign#quote
              - group [ref=e919]:
                - generic [ref=e920]:
                  - generic [ref=e921]:
                    - img "Wood & Metal Geometric Partition" [ref=e922]
                    - button "Add to wishlist" [ref=e923] [cursor=pointer]
                    - generic [ref=e926]:
                      - link "View Details" [ref=e927] [cursor=pointer]:
                        - /url: /metal-coating/product/wood-metal-geometric-partition
                      - button "Quick view" [ref=e928] [cursor=pointer]
                  - generic [ref=e932]:
                    - generic [ref=e933]:
                      - link [ref=e934] [cursor=pointer]:
                        - /url: /metal-coating/product/wood-metal-geometric-partition
                        - heading "Wood & Metal Geometric Partition" [level=3] [ref=e935]
                      - paragraph [ref=e936]: Metal Partitions Room Dividers
                      - paragraph [ref=e937]: Walnut brown / Dark wood appearance with metallic detailing
                    - generic [ref=e939]:
                      - link "Enquire on WhatsApp" [ref=e940] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Wood%20%26%20Metal%20Geometric%20Partition%0ACategory%3A%20Metal%20Partitions%20Room%20Dividers%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fwood-metal-geometric-partition%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e943] [cursor=pointer]:
                        - /url: /metal-coating?product=acd02606-3f62-426c-ab44-d99f2235f69a&productName=Wood+%26+Metal+Geometric+Partition#quote
              - group [ref=e947]:
                - generic [ref=e948]:
                  - generic [ref=e949]:
                    - img "Bilingual Corporate Name Plate" [ref=e950]
                    - generic [ref=e951]: New
                    - button "Add to wishlist" [ref=e952] [cursor=pointer]
                    - generic [ref=e955]:
                      - link "View Details" [ref=e956] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0149-bilingual-corporate-name-plate
                      - button "Quick view" [ref=e957] [cursor=pointer]
                  - generic [ref=e961]:
                    - generic [ref=e962]:
                      - link [ref=e963] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0149-bilingual-corporate-name-plate
                        - heading "Bilingual Corporate Name Plate" [level=3] [ref=e964]
                      - paragraph [ref=e965]: Metal Plaques Panels Signage
                      - paragraph [ref=e966]: Antique Gold / Champagne Gold Appearance
                    - generic [ref=e968]:
                      - link "Enquire on WhatsApp" [ref=e969] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Bilingual%20Corporate%20Name%20Plate%0ACategory%3A%20Metal%20Plaques%20Panels%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0149-bilingual-corporate-name-plate%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e972] [cursor=pointer]:
                        - /url: /metal-coating?product=709e1176-eeb5-498e-9426-51b7eb0ce574&productName=Bilingual+Corporate+Name+Plate#quote
              - group [ref=e976]:
                - generic [ref=e977]:
                  - generic [ref=e978]:
                    - img "Religious Metal Wall Artwork" [ref=e979]
                    - button "Add to wishlist" [ref=e980] [cursor=pointer]
                    - generic [ref=e983]:
                      - link "View Details" [ref=e984] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0029-religious-metal-wall-artwork
                      - button "Quick view" [ref=e985] [cursor=pointer]
                  - generic [ref=e989]:
                    - generic [ref=e990]:
                      - link [ref=e991] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0029-religious-metal-wall-artwork
                        - heading "Religious Metal Wall Artwork" [level=3] [ref=e992]
                      - paragraph [ref=e993]: Art Work
                      - paragraph [ref=e994]: Matte Black / Antique Bronze
                    - generic [ref=e996]:
                      - link "Enquire on WhatsApp" [ref=e997] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Religious%20Metal%20Wall%20Artwork%0ACategory%3A%20Art%20Work%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0029-religious-metal-wall-artwork%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1000] [cursor=pointer]:
                        - /url: /metal-coating?product=41190df5-5109-47d3-8460-40d95c8851df&productName=Religious+Metal+Wall+Artwork#quote
              - group [ref=e1004]:
                - generic [ref=e1005]:
                  - generic [ref=e1006]:
                    - img "Oval Gold Personalised Name Plate" [ref=e1007]
                    - button "Add to wishlist" [ref=e1008] [cursor=pointer]
                    - generic [ref=e1011]:
                      - link "View Details" [ref=e1012] [cursor=pointer]:
                        - /url: /metal-coating/product/Oval Gold Personalised Name Plate
                      - button "Quick view" [ref=e1013] [cursor=pointer]
                  - generic [ref=e1017]:
                    - generic [ref=e1018]:
                      - link [ref=e1019] [cursor=pointer]:
                        - /url: /metal-coating/product/Oval Gold Personalised Name Plate
                        - heading "Oval Gold Personalised Name Plate" [level=3] [ref=e1020]
                      - paragraph [ref=e1021]: Name Plates Signage
                      - paragraph [ref=e1022]: Champagne Gold / Dark Bronze Appearance
                    - generic [ref=e1024]:
                      - link "Enquire on WhatsApp" [ref=e1025] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Oval%20Gold%20Personalised%20Name%20Plate%0ACategory%3A%20Name%20Plates%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2FOval%20Gold%20Personalised%20Name%20Plate%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1028] [cursor=pointer]:
                        - /url: /metal-coating?product=af0ce323-e356-4321-a618-f9554a45db66&productName=Oval+Gold+Personalised+Name+Plate#quote
              - group [ref=e1032]:
                - generic [ref=e1033]:
                  - generic [ref=e1034]:
                    - img "Full-Height Vertical Metal Grill Screen" [ref=e1035]
                    - button "Add to wishlist" [ref=e1036] [cursor=pointer]
                    - generic [ref=e1039]:
                      - link "View Details" [ref=e1040] [cursor=pointer]:
                        - /url: /metal-coating/product/full-height-vertical-metal-grill-screen
                      - button "Quick view" [ref=e1041] [cursor=pointer]
                  - generic [ref=e1045]:
                    - generic [ref=e1046]:
                      - link [ref=e1047] [cursor=pointer]:
                        - /url: /metal-coating/product/full-height-vertical-metal-grill-screen
                        - heading "Full-Height Vertical Metal Grill Screen" [level=3] [ref=e1048]
                      - paragraph [ref=e1049]: Designer Door Grills
                      - paragraph [ref=e1050]: Bronze / Golden metallic appearance
                    - generic [ref=e1052]:
                      - link "Enquire on WhatsApp" [ref=e1053] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Full-Height%20Vertical%20Metal%20Grill%20Screen%0ACategory%3A%20Designer%20Door%20Grills%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Ffull-height-vertical-metal-grill-screen%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1056] [cursor=pointer]:
                        - /url: /metal-coating?product=6305087a-f4a2-4d6d-a90b-bc0a31a804a7&productName=Full-Height+Vertical+Metal+Grill+Screen#quote
              - group [ref=e1060]:
                - generic [ref=e1061]:
                  - generic [ref=e1062]:
                    - img "EMMA GROUP – Integrated Marble Feature Signage" [ref=e1063]
                    - button "Add to wishlist" [ref=e1064] [cursor=pointer]
                    - generic [ref=e1067]:
                      - link "View Details" [ref=e1068] [cursor=pointer]:
                        - /url: /metal-coating/product/emma-group-integrated-marble-feature-signage
                      - button "Quick view" [ref=e1069] [cursor=pointer]
                  - generic [ref=e1073]:
                    - generic [ref=e1074]:
                      - link [ref=e1075] [cursor=pointer]:
                        - /url: /metal-coating/product/emma-group-integrated-marble-feature-signage
                        - heading "EMMA GROUP – Integrated Marble Feature Signage" [level=3] [ref=e1076]
                      - paragraph [ref=e1077]: Metal Box Letters
                      - paragraph [ref=e1078]: Antique Gold / Champagne Gold Appearance
                    - generic [ref=e1080]:
                      - link "Enquire on WhatsApp" [ref=e1081] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20EMMA%20GROUP%20%E2%80%93%20Integrated%20Marble%20Feature%20Signage%0ACategory%3A%20Metal%20Box%20Letters%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Femma-group-integrated-marble-feature-signage%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1084] [cursor=pointer]:
                        - /url: /metal-coating?product=c1c832d2-779f-4914-adbb-a75647215a5e&productName=EMMA+GROUP+%E2%80%93+Integrated+Marble+Feature+Signage#quote
              - group [ref=e1088]:
                - generic [ref=e1089]:
                  - generic [ref=e1090]:
                    - img "Vertical Oval & Ring Motif Partition" [ref=e1091]
                    - button "Add to wishlist" [ref=e1092] [cursor=pointer]
                    - generic [ref=e1095]:
                      - link "View Details" [ref=e1096] [cursor=pointer]:
                        - /url: /metal-coating/product/vertical-oval-ring-motif-partition
                      - button "Quick view" [ref=e1097] [cursor=pointer]
                  - generic [ref=e1101]:
                    - generic [ref=e1102]:
                      - link [ref=e1103] [cursor=pointer]:
                        - /url: /metal-coating/product/vertical-oval-ring-motif-partition
                        - heading "Vertical Oval & Ring Motif Partition" [level=3] [ref=e1104]
                      - paragraph [ref=e1105]: Metal Partitions Room Dividers
                      - paragraph [ref=e1106]: Brushed gold / Champagne metallic appearance
                    - generic [ref=e1108]:
                      - link "Enquire on WhatsApp" [ref=e1109] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Vertical%20Oval%20%26%20Ring%20Motif%20Partition%0ACategory%3A%20Metal%20Partitions%20Room%20Dividers%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fvertical-oval-ring-motif-partition%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1112] [cursor=pointer]:
                        - /url: /metal-coating?product=cd771974-05da-4e5c-9402-2b73b0b6d9ef&productName=Vertical+Oval+%26+Ring+Motif+Partition#quote
              - group [ref=e1116]:
                - generic [ref=e1117]:
                  - generic [ref=e1118]:
                    - img "Multi-Column Building Directory Board" [ref=e1119]
                    - button "Add to wishlist" [ref=e1120] [cursor=pointer]
                    - generic [ref=e1123]:
                      - link "View Details" [ref=e1124] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0147-building-directory-board
                      - button "Quick view" [ref=e1125] [cursor=pointer]
                  - generic [ref=e1129]:
                    - generic [ref=e1130]:
                      - link [ref=e1131] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0147-building-directory-board
                        - heading "Multi-Column Building Directory Board" [level=3] [ref=e1132]
                      - paragraph [ref=e1133]: Metal Plaques Panels Signage
                      - paragraph [ref=e1134]: Silver / Brushed Metallic Appearance
                    - generic [ref=e1136]:
                      - link "Enquire on WhatsApp" [ref=e1137] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Multi-Column%20Building%20Directory%20Board%0ACategory%3A%20Metal%20Plaques%20Panels%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0147-building-directory-board%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1140] [cursor=pointer]:
                        - /url: /metal-coating?product=646ca346-6057-4c2d-ac55-7f62cedb9f05&productName=Multi-Column+Building+Directory+Board#quote
              - group [ref=e1144]:
                - generic [ref=e1145]:
                  - generic [ref=e1146]:
                    - img "Decorative Metal Ceiling Installation" [ref=e1147]
                    - button "Add to wishlist" [ref=e1148] [cursor=pointer]
                    - generic [ref=e1151]:
                      - link "View Details" [ref=e1152] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0028-decorative-metal-ceiling
                      - button "Quick view" [ref=e1153] [cursor=pointer]
                  - generic [ref=e1157]:
                    - generic [ref=e1158]:
                      - link [ref=e1159] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0028-decorative-metal-ceiling
                        - heading "Decorative Metal Ceiling Installation" [level=3] [ref=e1160]
                      - paragraph [ref=e1161]: Art Work
                      - paragraph [ref=e1162]: Black / Dark Bronze
                    - generic [ref=e1164]:
                      - link "Enquire on WhatsApp" [ref=e1165] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Decorative%20Metal%20Ceiling%20Installation%0ACategory%3A%20Art%20Work%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0028-decorative-metal-ceiling%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1168] [cursor=pointer]:
                        - /url: /metal-coating?product=782793e1-3892-462c-b793-587798f8750f&productName=Decorative+Metal+Ceiling+Installation#quote
              - group [ref=e1172]:
                - generic [ref=e1173]:
                  - generic [ref=e1174]:
                    - img "Teal Circular Personalised Name Plate" [ref=e1175]
                    - button "Add to wishlist" [ref=e1176] [cursor=pointer]
                    - generic [ref=e1179]:
                      - link "View Details" [ref=e1180] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0085-teal-circular-name-plate
                      - button "Quick view" [ref=e1181] [cursor=pointer]
                  - generic [ref=e1185]:
                    - generic [ref=e1186]:
                      - link [ref=e1187] [cursor=pointer]:
                        - /url: /metal-coating/product/metal-p0085-teal-circular-name-plate
                        - heading "Teal Circular Personalised Name Plate" [level=3] [ref=e1188]
                      - paragraph [ref=e1189]: Name Plates Signage
                      - paragraph [ref=e1190]: Teal Green / Antique Gold Appearance
                    - generic [ref=e1192]:
                      - link "Enquire on WhatsApp" [ref=e1193] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Teal%20Circular%20Personalised%20Name%20Plate%0ACategory%3A%20Name%20Plates%20Signage%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fmetal-p0085-teal-circular-name-plate%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1196] [cursor=pointer]:
                        - /url: /metal-coating?product=2d7c3bf7-93d6-4f05-add2-c31d71b5813d&productName=Teal+Circular+Personalised+Name+Plate#quote
              - group [ref=e1200]:
                - generic [ref=e1201]:
                  - generic [ref=e1202]:
                    - img "Golden Arched Door Grill" [ref=e1203]
                    - button "Add to wishlist" [ref=e1204] [cursor=pointer]
                    - generic [ref=e1207]:
                      - link "View Details" [ref=e1208] [cursor=pointer]:
                        - /url: /metal-coating/product/golden-arched-decorative-door-grill
                      - button "Quick view" [ref=e1209] [cursor=pointer]
                  - generic [ref=e1213]:
                    - generic [ref=e1214]:
                      - link [ref=e1215] [cursor=pointer]:
                        - /url: /metal-coating/product/golden-arched-decorative-door-grill
                        - heading "Golden Arched Door Grill" [level=3] [ref=e1216]
                      - paragraph [ref=e1217]: Designer Door Grills
                      - paragraph [ref=e1218]: Antique gold / Champagne metallic.
                    - generic [ref=e1220]:
                      - link "Enquire on WhatsApp" [ref=e1221] [cursor=pointer]:
                        - /url: https://wa.me/917666067782?text=Hello%2C%20I%20am%20interested%20in%20the%20following%20Metal%20product%3A%0A%0AProduct%3A%20Golden%20Arched%20Door%20Grill%0ACategory%3A%20Designer%20Door%20Grills%0AProduct%20Link%3A%20http%3A%2F%2F127.0.0.1%3A3019%2Fmetal-coating%2Fproduct%2Fgolden-arched-decorative-door-grill%0A%0APlease%20share%20the%20details%20and%20pricing.
                      - link "Enquire Now" [ref=e1224] [cursor=pointer]:
                        - /url: /metal-coating?product=a079f547-7642-4a21-ae20-5d751c654624&productName=Golden+Arched+Door+Grill#quote
            - button "Previous slide" [disabled]
            - button "Next slide" [ref=e1228] [cursor=pointer]
    - generic [ref=e1233]:
      - generic [ref=e1234]:
        - paragraph [ref=e1235]: OUR WORK IN MOTION
        - heading "Craftsmanship in Every Detail" [level=2] [ref=e1236]
        - paragraph [ref=e1237]: Explore real projects, premium finishes and workshop craftsmanship through our latest videos.
      - generic [ref=e1238]:
        - button "Previous reel" [disabled]
        - generic "Instagram reels carousel" [ref=e1239]:
          - generic [ref=e1240]:
            - generic [ref=e1241]:
              - button [ref=e1242] [cursor=pointer]
              - generic [ref=e1243]: "@rtmetalcoating"
              - paragraph [ref=e1248]: Workshop Reel 01
            - generic [ref=e1249]:
              - button [ref=e1250] [cursor=pointer]
              - generic [ref=e1251]: "@rtmetalcoating"
              - paragraph [ref=e1256]: Workshop Reel 02
            - generic [ref=e1257]:
              - button [ref=e1258] [cursor=pointer]
              - generic [ref=e1259]: "@rtmetalcoating"
              - paragraph [ref=e1264]: Workshop Reel 03
            - generic [ref=e1265]:
              - button [ref=e1266] [cursor=pointer]
              - generic [ref=e1267]: "@rtmetalcoating"
              - paragraph [ref=e1272]: Workshop Reel 04
            - generic [ref=e1273]:
              - button [ref=e1274] [cursor=pointer]
              - generic [ref=e1275]: "@rtmetalcoating"
              - paragraph [ref=e1280]: Workshop Reel 05
            - generic [ref=e1281]:
              - button [ref=e1282] [cursor=pointer]
              - generic [ref=e1283]: "@rtmetalcoating"
              - paragraph [ref=e1288]: Workshop Reel 06
            - generic [ref=e1289]:
              - button [ref=e1290] [cursor=pointer]
              - generic [ref=e1291]: "@rtmetalcoating"
              - paragraph [ref=e1296]: Workshop Reel 07
        - button "Next reel" [ref=e1297] [cursor=pointer]
      - link "Follow Our Work on Instagram" [ref=e1301] [cursor=pointer]:
        - /url: https://www.instagram.com/rtmetalcoating/
    - generic [ref=e1306]:
      - generic [ref=e1307]:
        - paragraph [ref=e1308]: Get in touch
        - heading "Let's start a conversation." [level=2] [ref=e1309]
        - paragraph [ref=e1310]: Whether it is a product enquiry, a coating brief or a full project — tell us what you have in mind.
      - generic [ref=e1311]:
        - generic [ref=e1313]:
          - generic [ref=e1314]:
            - heading "Contact details" [level=3] [ref=e1315]
            - paragraph [ref=e1316]: Prefer to reach out directly? We are here Monday to Saturday, 10am to 7pm.
          - list [ref=e1317]:
            - listitem [ref=e1318]:
              - generic [ref=e1323]:
                - paragraph [ref=e1324]: Studio
                - paragraph [ref=e1325]: Compound No. 194, 6th Lane, Kumbharwada, Near Trimbak Parshuram Street, Near Public Toilet, Mumbai, Maharashtra – 400004, India.
            - listitem [ref=e1326]:
              - generic [ref=e1330]:
                - paragraph [ref=e1331]: Phone
                - generic [ref=e1332]: +91 76660 67782
            - listitem [ref=e1333]:
              - generic [ref=e1338]:
                - paragraph [ref=e1339]: Email
                - generic [ref=e1340]: rtmetalservice@gmail.com
          - button "Chat on WhatsApp" [ref=e1341] [cursor=pointer]
        - generic [ref=e1345]:
          - generic [ref=e1346]:
            - generic [ref=e1347]:
              - generic [ref=e1348]: Name *
              - textbox "Name *" [ref=e1349]:
                - /placeholder: Your name
            - generic [ref=e1350]:
              - generic [ref=e1351]: Mobile Number *
              - textbox "Mobile Number *" [ref=e1352]:
                - /placeholder: +91 98765 43210
            - generic [ref=e1353]:
              - generic [ref=e1354]: Email (optional)
              - textbox "Email (optional)" [ref=e1355]:
                - /placeholder: you@email.com
          - generic [ref=e1356]:
            - generic [ref=e1357]: I am interested in
            - combobox [ref=e1358]:
              - option "Home Decor & Lifestyle Products" [selected]
              - option "Metal Coating Services"
              - option "Custom / Bespoke Project"
              - option "Trade & Bulk Enquiry"
          - generic [ref=e1359]:
            - generic [ref=e1360]: Message
            - textbox "Tell us about your project..." [ref=e1361]
          - button "Send Enquiry" [ref=e1362] [cursor=pointer]
    - generic [ref=e1368]:
      - paragraph [ref=e1369]: Ready when you are
      - heading "Let's build something lasting." [level=2] [ref=e1370]
      - paragraph [ref=e1371]: Explore the collection or request a quote for premium metal coating — we will respond within one business day.
      - generic [ref=e1372]:
        - link "Shop Home Decor" [ref=e1373] [cursor=pointer]:
          - /url: /home-decor
        - link "Metal Coating Services" [ref=e1376] [cursor=pointer]:
          - /url: /metal-coating
  - contentinfo [ref=e1377]:
    - generic [ref=e1378]:
      - generic [ref=e1379]:
        - generic [ref=e1380]:
          - link "RTMETALCOATING homepage" [ref=e1381] [cursor=pointer]:
            - /url: /
            - img "RTMETALCOATING" [ref=e1383]
          - paragraph [ref=e1384]: Metal coating, surface finishing and decorative products for residential, commercial and architectural projects.
          - generic [ref=e1385]:
            - generic [ref=e1386]:
              - paragraph [ref=e1387]: RTMETALCOATING
              - paragraph [ref=e1388]:
                - text: Metal Coating & Decorative Finishing Services
                - generic [ref=e1389]: Mumbai, Maharashtra, India
            - generic [ref=e1390]:
              - paragraph [ref=e1391]: RT HOME DECOR
              - paragraph [ref=e1392]:
                - text: Online Home Decoration Store
                - generic [ref=e1393]: Wai, Satara, Maharashtra, India
          - generic [ref=e1394]:
            - link "Instagram" [ref=e1395] [cursor=pointer]:
              - /url: https://www.instagram.com/rtmetalcoating/
            - button "WhatsApp" [ref=e1399] [cursor=pointer]
            - button "Email contact pending" [disabled] [ref=e1402]
        - generic [ref=e1407]:
          - generic [ref=e1408]:
            - generic [ref=e1409]:
              - heading "Collections" [level=3] [ref=e1410]
              - list [ref=e1411]:
                - listitem [ref=e1412]:
                  - link "Home Decor" [ref=e1413] [cursor=pointer]:
                    - /url: /home-decor?category=home-decor
                - listitem [ref=e1418]:
                  - link "Decorative Accessories" [ref=e1419] [cursor=pointer]:
                    - /url: /home-decor?category=decorative-accessories
                - listitem [ref=e1424]:
                  - link "Gift Articles" [ref=e1425] [cursor=pointer]:
                    - /url: /home-decor?category=gift-articles
                - listitem [ref=e1430]:
                  - link "Lifestyle Products" [ref=e1431] [cursor=pointer]:
                    - /url: /home-decor?category=lifestyle-products
                - listitem [ref=e1436]:
                  - link "Household Products" [ref=e1437] [cursor=pointer]:
                    - /url: /home-decor?category=household-products
                - listitem [ref=e1442]:
                  - link "Daily Utility" [ref=e1443] [cursor=pointer]:
                    - /url: /home-decor?category=daily-utility
            - generic [ref=e1448]:
              - heading "Services" [level=3] [ref=e1449]
              - list [ref=e1450]:
                - listitem [ref=e1451]:
                  - link "MS Coating" [ref=e1452] [cursor=pointer]:
                    - /url: /metal-coating#ms-coating
                - listitem [ref=e1457]:
                  - link "Brass Coating" [ref=e1458] [cursor=pointer]:
                    - /url: /metal-coating#brass-coating
                - listitem [ref=e1463]:
                  - link "Decorative Finishing" [ref=e1464] [cursor=pointer]:
                    - /url: /metal-coating#decorative-metal-finishing
                - listitem [ref=e1469]:
                  - link "Premium Surface Finishing" [ref=e1470] [cursor=pointer]:
                    - /url: /metal-coating#premium-surface-finishing
                - listitem [ref=e1475]:
                  - link "Custom Metal Coating" [ref=e1476] [cursor=pointer]:
                    - /url: /metal-coating#custom-metal-coating
                - listitem [ref=e1481]:
                  - link "Architectural Finishes" [ref=e1482] [cursor=pointer]:
                    - /url: /metal-coating#architectural-metal-finishes
            - generic [ref=e1487]:
              - heading "Company" [level=3] [ref=e1488]
              - list [ref=e1489]:
                - listitem [ref=e1490]:
                  - link "About" [ref=e1491] [cursor=pointer]:
                    - /url: /about
                - listitem [ref=e1496]:
                  - link "Before & After" [ref=e1497] [cursor=pointer]:
                    - /url: /before-after
                - listitem [ref=e1502]:
                  - link "Our Process" [ref=e1503] [cursor=pointer]:
                    - /url: /#process
                - listitem [ref=e1508]:
                  - link "Testimonials" [ref=e1509] [cursor=pointer]:
                    - /url: /#testimonials
                - listitem [ref=e1514]:
                  - link "Contact" [ref=e1515] [cursor=pointer]:
                    - /url: /#contact
          - generic [ref=e1520]:
            - generic [ref=e1521]:
              - heading "Get in Touch" [level=3] [ref=e1522]
              - list [ref=e1523]:
                - listitem [ref=e1524]:
                  - generic [ref=e1528]: Compound No. 194, 6th Lane, Kumbharwada, Near Trimbak Parshuram Street, Near Public Toilet, Mumbai, Maharashtra – 400004, India.
                - listitem [ref=e1529]:
                  - generic [ref=e1532]: +91 76660 67782
                - listitem [ref=e1533]:
                  - generic [ref=e1537]: rtmetalservice@gmail.com
            - generic [ref=e1538]:
              - generic [ref=e1539]:
                - paragraph [ref=e1540]: Metal Coating Location
                - heading "Find Us in Mumbai" [level=3] [ref=e1544]
                - paragraph [ref=e1545]: Kumbharwada, Mumbai 400004
              - link "View on Google Maps" [ref=e1549] [cursor=pointer]:
                - /url: https://maps.app.goo.gl/wtmGuotpv7b35y8W6
      - generic [ref=e1558]:
        - paragraph [ref=e1559]: © 2026 RTMETALCOATING. All rights reserved.
        - generic [ref=e1560]:
          - link "Privacy" [ref=e1561] [cursor=pointer]:
            - /url: /
          - link "Terms" [ref=e1563] [cursor=pointer]:
            - /url: /
  - alert [ref=e1564]
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