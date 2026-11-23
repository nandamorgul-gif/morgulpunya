/**
 * SEMEISTVO TECH · 2026 curated PC component demo catalogue
 * Model/spec references: manufacturer official product pages.
 * All prices are illustrative estimates. Do not interpret as live retail or stock.
 * Images are original category illustrations, NOT actual product photographs.
 */
const PC_DATA = {
  "catalogEdition": "2026",
  "catalogUpdatedAt": "2026-11-23",
  "pricingNote": "Harga simulasi / estimasi, bukan harga pasar real-time. Stok 0 sampai dikonfirmasi admin.",
  "categories": [
    {
      "id": "cpu",
      "name": "Processor (CPU)",
      "icon": "cpu",
      "required": true
    },
    {
      "id": "gpu",
      "name": "Kartu Grafis (GPU)",
      "icon": "monitor",
      "required": true
    },
    {
      "id": "motherboard",
      "name": "Motherboard",
      "icon": "server",
      "required": true
    },
    {
      "id": "ram",
      "name": "Memori RAM",
      "icon": "layers",
      "required": true
    },
    {
      "id": "storage",
      "name": "SSD & Penyimpanan",
      "icon": "hard-drive",
      "required": true
    },
    {
      "id": "psu",
      "name": "Power Supply (PSU)",
      "icon": "zap",
      "required": true
    },
    {
      "id": "case",
      "name": "Casing",
      "icon": "box",
      "required": true
    },
    {
      "id": "cooler",
      "name": "Pendingin CPU",
      "icon": "wind",
      "required": false
    },
    {
      "id": "accessories",
      "name": "Aksesoris",
      "icon": "grid",
      "required": false
    },
    {
      "id": "software",
      "name": "Instalasi & Setup",
      "icon": "download",
      "required": false
    }
  ],
  "components": {
    "cpu": [
      {
        "id": "cpu-r5-9600x",
        "name": "AMD Ryzen 5 9600X",
        "brand": "AMD",
        "price": 3550000,
        "watts": 65,
        "description": "Zen 5 · 6 core/12 thread · AM5, gaming dan produktivitas.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "source": "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-5-9600x.html",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cpu-r7-9700x",
        "name": "AMD Ryzen 7 9700X",
        "brand": "AMD",
        "price": 5250000,
        "watts": 65,
        "description": "Zen 5 · 8 core/16 thread · AM5, streaming & editing.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cpu-r7-9850x3d",
        "name": "AMD Ryzen 7 9850X3D (2026)",
        "brand": "AMD",
        "price": 9650000,
        "watts": 120,
        "description": "Zen 5 + 3D V-Cache · AM5, kelas gaming enthusiast 2026.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "source": "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9850x3d.html",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cpu-r9-9950x3d",
        "name": "AMD Ryzen 9 9950X3D",
        "brand": "AMD",
        "price": 13250000,
        "watts": 170,
        "description": "Zen 5 · 16 core/32 thread · AM5 untuk kreator dan gaming high-end.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "source": "https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x3d.html",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cpu-ultra5-250kplus",
        "name": "Intel Core Ultra 5 250K Plus (2026)",
        "brand": "Intel",
        "price": 4650000,
        "watts": 125,
        "description": "Core Ultra Desktop Series 2 · LGA1851 · DDR5.",
        "socket": "LGA1851",
        "memoryType": "DDR5",
        "source": "https://www.intel.com/content/www/us/en/support/articles/000099656/processors.html",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cpu-ultra7-270kplus",
        "name": "Intel Core Ultra 7 270K Plus (2026)",
        "brand": "Intel",
        "price": 6750000,
        "watts": 125,
        "description": "Core Ultra Desktop Series 2 · LGA1851 · DDR5, kreator dan gaming.",
        "socket": "LGA1851",
        "memoryType": "DDR5",
        "source": "https://www.intel.com/content/www/us/en/support/articles/000099656/processors.html",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cpu-ultra9-285k",
        "name": "Intel Core Ultra 9 285K",
        "brand": "Intel",
        "price": 9850000,
        "watts": 125,
        "description": "Core Ultra Desktop Series 2 · LGA1851 · DDR5, workstation.",
        "socket": "LGA1851",
        "memoryType": "DDR5",
        "image": "images/products/cpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "gpu": [
      {
        "id": "gpu-rtx5060ti16",
        "name": "NVIDIA GeForce RTX 5060 Ti 16GB",
        "brand": "NVIDIA",
        "price": 8150000,
        "watts": 180,
        "description": "Blackwell · GDDR7 16GB · DLSS 4, gaming 1080p/1440p.",
        "vramGB": 16,
        "source": "https://www.nvidia.com/id-id/geforce/graphics-cards/50-series/rtx-5060-family/",
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rtx5070",
        "name": "NVIDIA GeForce RTX 5070 12GB",
        "brand": "NVIDIA",
        "price": 11850000,
        "watts": 250,
        "description": "Blackwell · GDDR7 12GB · DLSS 4, gaming 1440p.",
        "vramGB": 12,
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rtx5070ti",
        "name": "NVIDIA GeForce RTX 5070 Ti 16GB",
        "brand": "NVIDIA",
        "price": 17350000,
        "watts": 300,
        "description": "Blackwell · GDDR7 16GB · DLSS 4, gaming 1440p/4K.",
        "vramGB": 16,
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rtx5080",
        "name": "NVIDIA GeForce RTX 5080 16GB",
        "brand": "NVIDIA",
        "price": 26150000,
        "watts": 360,
        "description": "Blackwell · GDDR7 16GB, gaming 4K dan editing.",
        "vramGB": 16,
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rtx5090",
        "name": "NVIDIA GeForce RTX 5090 32GB",
        "brand": "NVIDIA",
        "price": 59500000,
        "watts": 575,
        "description": "Blackwell · GDDR7 32GB, kelas flagship AI dan render.",
        "vramGB": 32,
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rx9060xt16",
        "name": "AMD Radeon RX 9060 XT 16GB",
        "brand": "AMD Radeon",
        "price": 7650000,
        "watts": 160,
        "description": "RDNA 4 · GDDR6 16GB, gaming 1080p/1440p.",
        "vramGB": 16,
        "source": "https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9060xt.html",
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rx9070",
        "name": "AMD Radeon RX 9070 16GB",
        "brand": "AMD Radeon",
        "price": 11150000,
        "watts": 220,
        "description": "RDNA 4 · GDDR6 16GB, gaming 1440p.",
        "vramGB": 16,
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "gpu-rx9070xt",
        "name": "AMD Radeon RX 9070 XT 16GB",
        "brand": "AMD Radeon",
        "price": 13750000,
        "watts": 304,
        "description": "RDNA 4 · GDDR6 16GB, gaming 1440p/4K.",
        "vramGB": 16,
        "source": "https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070XT.html",
        "image": "images/products/gpu.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "motherboard": [
      {
        "id": "mb-asus-b850",
        "name": "ASUS TUF GAMING B850-PLUS WIFI",
        "brand": "ASUS",
        "price": 3950000,
        "watts": 45,
        "description": "Socket AM5 · chipset B850 · DDR5 · form factor ATX.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "formFactor": "ATX",
        "source": "https://www.asus.com/id/motherboards-components/motherboards/all-series/tuf-gaming-b850-plus-wifi/",
        "image": "images/products/motherboard.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "mb-msi-b850",
        "name": "MSI B850 GAMING PLUS WIFI",
        "brand": "MSI",
        "price": 3650000,
        "watts": 45,
        "description": "Socket AM5 · B850 · DDR5 · ATX.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "formFactor": "ATX",
        "source": "https://www.msi.com/Motherboard/B850-GAMING-PLUS-WIFI/Specification",
        "image": "images/products/motherboard.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "mb-asrock-b850i",
        "name": "ASRock B850I Lightning WiFi",
        "brand": "ASRock",
        "price": 4250000,
        "watts": 35,
        "description": "Socket AM5 · B850 · DDR5 · Mini-ITX untuk build compact.",
        "socket": "AM5",
        "memoryType": "DDR5",
        "formFactor": "Mini-ITX",
        "source": "https://pg.asrock.com/MB/AMD/B850I%20Lightning%20WiFi/index.asp",
        "image": "images/products/motherboard.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "mb-msi-b860",
        "name": "MSI MAG B860 TOMAHAWK WIFI",
        "brand": "MSI",
        "price": 3950000,
        "watts": 45,
        "description": "Socket LGA1851 · chipset B860 · DDR5 · ATX.",
        "socket": "LGA1851",
        "memoryType": "DDR5",
        "formFactor": "ATX",
        "source": "https://www.msi.com/Motherboard/MAG-B860-TOMAHAWK-WIFI/Specification",
        "image": "images/products/motherboard.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "mb-gigabyte-z890",
        "name": "GIGABYTE Z890 AORUS ELITE WIFI7 ICE",
        "brand": "GIGABYTE",
        "price": 5750000,
        "watts": 50,
        "description": "Socket LGA1851 · Z890 · DDR5 · ATX putih.",
        "socket": "LGA1851",
        "memoryType": "DDR5",
        "formFactor": "ATX",
        "source": "https://www.gigabyte.com/Motherboard/Z890-AORUS-ELITE-WIFI7-ICE",
        "image": "images/products/motherboard.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "ram": [
      {
        "id": "ram-16-ddr5",
        "name": "Kingston FURY Beast 16GB (2×8GB) DDR5-5600",
        "brand": "Kingston",
        "price": 1250000,
        "watts": 10,
        "description": "RAM DDR5 dual-channel · 16GB, untuk PC kelas entry.",
        "memoryType": "DDR5",
        "image": "images/products/ram.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "ram-32-ddr5",
        "name": "G.Skill Flare X5 32GB (2×16GB) DDR5-6000",
        "brand": "G.Skill",
        "price": 2450000,
        "watts": 12,
        "description": "RAM DDR5 32GB · profil EXPO, gaming dan editing.",
        "memoryType": "DDR5",
        "image": "images/products/ram.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "ram-32-white",
        "name": "TEAMGROUP T-Force Delta RGB 32GB DDR5-6000 White",
        "brand": "TEAMGROUP",
        "price": 2650000,
        "watts": 12,
        "description": "RAM DDR5 32GB dual-channel dengan RGB bertema putih.",
        "memoryType": "DDR5",
        "image": "images/products/ram.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "ram-64-ddr5",
        "name": "Corsair Vengeance 64GB (2×32GB) DDR5-6000",
        "brand": "Corsair",
        "price": 5050000,
        "watts": 16,
        "description": "RAM DDR5 64GB untuk editing 4K, virtualisasi dan workstation.",
        "memoryType": "DDR5",
        "image": "images/products/ram.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "storage": [
      {
        "id": "ssd-wd-sn850x-1t",
        "name": "WD_BLACK SN850X 1TB NVMe PCIe 4.0",
        "brand": "WD_BLACK",
        "price": 1550000,
        "watts": 7,
        "description": "SSD M.2 2280, kapasitas 1TB untuk OS dan game.",
        "image": "images/products/storage.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "ssd-samsung-990pro-2t",
        "name": "Samsung 990 PRO 2TB NVMe PCIe 4.0",
        "brand": "Samsung",
        "price": 2850000,
        "watts": 8,
        "description": "SSD M.2 2280 2TB untuk kreator dan gaming.",
        "image": "images/products/storage.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "ssd-crucial-t705-2t",
        "name": "Crucial T705 2TB NVMe PCIe 5.0",
        "brand": "Crucial",
        "price": 4950000,
        "watts": 11,
        "description": "SSD Gen5 2TB; membutuhkan pendinginan M.2 yang memadai.",
        "image": "images/products/storage.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "ssd-kingston-kc3000-2t",
        "name": "Kingston KC3000 2TB NVMe PCIe 4.0",
        "brand": "Kingston",
        "price": 2550000,
        "watts": 9,
        "description": "SSD performa tinggi 2TB untuk produksi konten.",
        "image": "images/products/storage.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "psu": [
      {
        "id": "psu-msi-650",
        "name": "MSI MAG A650BN 650W 80+ Bronze",
        "brand": "MSI",
        "price": 1050000,
        "watts": 0,
        "description": "PSU ATX 650W untuk kelas menengah.",
        "capacityWatts": 650,
        "psuFormFactor": "ATX",
        "image": "images/products/psu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "psu-corsair-850",
        "name": "Corsair RM850e 850W 80+ Gold",
        "brand": "Corsair",
        "price": 2250000,
        "watts": 0,
        "description": "PSU ATX modular, cek konektor GPU sesuai varian.",
        "capacityWatts": 850,
        "psuFormFactor": "ATX",
        "image": "images/products/psu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "psu-cm-sfx850",
        "name": "Cooler Master V SFX Gold 850W White",
        "brand": "Cooler Master",
        "price": 2650000,
        "watts": 0,
        "description": "PSU SFX 850W modular, cocok casing Mini-ITX dengan dukungan SFX.",
        "capacityWatts": 850,
        "psuFormFactor": "SFX",
        "image": "images/products/psu.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "psu-seasonic-1000",
        "name": "Seasonic FOCUS GX-1000 1000W Gold",
        "brand": "Seasonic",
        "price": 3150000,
        "watts": 0,
        "description": "PSU ATX 1000W untuk rakitan kelas high-end.",
        "capacityWatts": 1000,
        "psuFormFactor": "ATX",
        "image": "images/products/psu.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "case": [
      {
        "id": "case-ch160-white",
        "name": "DeepCool CH160 WH Mini-ITX White",
        "brand": "DeepCool",
        "price": 1150000,
        "watts": 0,
        "description": "Casing Mini-ITX ringkas, batas GPU bergantung PSU dan konfigurasi.",
        "supportedFormFactors": [
          "Mini-ITX"
        ],
        "supportedPsuTypes": [
          "SFX",
          "ATX"
        ],
        "image": "images/products/case.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "case-air903",
        "name": "Montech AIR 903 MAX Black",
        "brand": "Montech",
        "price": 1250000,
        "watts": 0,
        "description": "Casing airflow ATX tower dengan ruang rakitan lega.",
        "supportedFormFactors": [
          "ATX",
          "Micro-ATX",
          "Mini-ITX"
        ],
        "supportedPsuTypes": [
          "ATX"
        ],
        "image": "images/products/case.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "case-o11",
        "name": "Lian Li O11D EVO RGB White",
        "brand": "Lian Li",
        "price": 2950000,
        "watts": 0,
        "description": "Casing dual-chamber ATX premium untuk build putih.",
        "supportedFormFactors": [
          "ATX",
          "Micro-ATX",
          "Mini-ITX"
        ],
        "supportedPsuTypes": [
          "ATX"
        ],
        "image": "images/products/case.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "case-nr200p",
        "name": "Cooler Master NR200P White Mini-ITX",
        "brand": "Cooler Master",
        "price": 1950000,
        "watts": 0,
        "description": "Casing Mini-ITX compact dengan dukungan PSU SFX.",
        "supportedFormFactors": [
          "Mini-ITX"
        ],
        "supportedPsuTypes": [
          "SFX"
        ],
        "image": "images/products/case.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "cooler": [
      {
        "id": "cooler-ak400",
        "name": "DeepCool AK400 Air Cooler",
        "brand": "DeepCool",
        "price": 490000,
        "watts": 6,
        "description": "Air cooler tower untuk CPU dengan beban panas moderat.",
        "image": "images/products/cooler.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cooler-ak620",
        "name": "DeepCool AK620 Dual Tower Air Cooler",
        "brand": "DeepCool",
        "price": 1190000,
        "watts": 7,
        "description": "Air cooler dual-tower untuk gaming enthusiast.",
        "image": "images/products/cooler.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cooler-arctic-240",
        "name": "ARCTIC Liquid Freezer III 240 AIO",
        "brand": "ARCTIC",
        "price": 1950000,
        "watts": 10,
        "description": "AIO liquid cooler 240 mm; cek dukungan radiator casing.",
        "radiatorSizeMm": 240,
        "image": "images/products/cooler.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "cooler-nzxt-360",
        "name": "NZXT Kraken Elite 360 RGB AIO",
        "brand": "NZXT",
        "price": 4150000,
        "watts": 12,
        "description": "AIO 360 mm untuk high-end; cek dudukan dan ruang casing.",
        "radiatorSizeMm": 360,
        "image": "images/products/cooler.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "accessories": [
      {
        "id": "acc-arctic-p12",
        "name": "ARCTIC P12 PWM PST Fan 120mm",
        "brand": "ARCTIC",
        "price": 185000,
        "watts": 3,
        "description": "Kipas casing 120 mm PWM.",
        "image": "images/products/accessories.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "acc-sleeves",
        "name": "Custom Sleeved Cable Extension Set",
        "brand": "SEMEISTVO",
        "price": 385000,
        "watts": 0,
        "description": "Kabel ekstensi tampilan; pastikan sesuai standar konektor PSU.",
        "image": "images/products/accessories.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "acc-bracket",
        "name": "GPU Support Bracket Adjustable",
        "brand": "SEMEISTVO",
        "price": 195000,
        "watts": 0,
        "description": "Penyangga GPU untuk mengurangi sag.",
        "image": "images/products/accessories.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ],
    "software": [
      {
        "id": "soft-drivers",
        "name": "Paket Setup Driver & Optimasi Dasar",
        "brand": "SEMEISTVO Services",
        "price": 150000,
        "watts": 0,
        "description": "Instalasi driver, update OS dan pemeriksaan sistem. Lisensi OS belum termasuk.",
        "image": "images/products/software.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "soft-gamer",
        "name": "Paket Game & Streaming Setup",
        "brand": "SEMEISTVO Services",
        "price": 250000,
        "watts": 0,
        "description": "Konfigurasi OBS, aplikasi game resmi dan software diagnostik.",
        "image": "images/products/software.svg",
        "imageType": "illustration",
        "isEstimate": true
      },
      {
        "id": "soft-creator",
        "name": "Paket Creator & Developer Setup",
        "brand": "SEMEISTVO Services",
        "price": 325000,
        "watts": 0,
        "description": "Konfigurasi aplikasi resmi dan tools produktivitas; lisensi komersial terpisah.",
        "image": "images/products/software.svg",
        "imageType": "illustration",
        "isEstimate": true
      }
    ]
  },
  "presets": [
    {
      "id": "budget-esports",
      "title": "SVO STARTER 1080p",
      "badge": "Gaming & Entry Creator",
      "tagline": "Ryzen 5 9600X · RTX 5060 Ti 16GB · DDR5 32GB. Basis gaming modern.",
      "image": "images/products/pcbuild.svg",
      "components": {
        "cpu": "cpu-r5-9600x",
        "gpu": "gpu-rtx5060ti16",
        "motherboard": "mb-msi-b850",
        "ram": "ram-32-ddr5",
        "storage": "ssd-wd-sn850x-1t",
        "psu": "psu-msi-650",
        "case": "case-air903",
        "cooler": "cooler-ak400"
      },
      "totalPrice": 22140000,
      "estimatedWatts": 315,
      "recommendedPsu": "650W (periksa headroom)"
    },
    {
      "id": "amd-streamer-1440p",
      "title": "SVO STREAM PRO",
      "badge": "1440p Streaming",
      "tagline": "Ryzen 7 9850X3D · RTX 5070 Ti 16GB · RAM DDR5 32GB.",
      "image": "images/products/pcbuild.svg",
      "components": {
        "cpu": "cpu-r7-9850x3d",
        "gpu": "gpu-rtx5070ti",
        "motherboard": "mb-asus-b850",
        "ram": "ram-32-ddr5",
        "storage": "ssd-samsung-990pro-2t",
        "psu": "psu-corsair-850",
        "case": "case-air903",
        "cooler": "cooler-ak620"
      },
      "totalPrice": 40940000,
      "estimatedWatts": 492,
      "recommendedPsu": "850W (periksa headroom)"
    },
    {
      "id": "creator-4k-beast",
      "title": "SVO CREATOR ULTRA",
      "badge": "4K / Workstation",
      "tagline": "Ryzen 9 9950X3D · RTX 5080 · DDR5 64GB untuk pekerjaan intensif.",
      "image": "images/products/pcbuild.svg",
      "components": {
        "cpu": "cpu-r9-9950x3d",
        "gpu": "gpu-rtx5080",
        "motherboard": "mb-asus-b850",
        "ram": "ram-64-ddr5",
        "storage": "ssd-crucial-t705-2t",
        "psu": "psu-seasonic-1000",
        "case": "case-o11",
        "cooler": "cooler-nzxt-360"
      },
      "totalPrice": 63600000,
      "estimatedWatts": 614,
      "recommendedPsu": "1000W (periksa headroom)"
    },
    {
      "id": "intel-creator-2026",
      "title": "SVO INTEL WORK",
      "badge": "Intel 2026",
      "tagline": "Core Ultra 7 270K Plus · RTX 5070 · DDR5 32GB untuk kerja dan gaming.",
      "image": "images/products/pcbuild.svg",
      "components": {
        "cpu": "cpu-ultra7-270kplus",
        "gpu": "gpu-rtx5070",
        "motherboard": "mb-msi-b860",
        "ram": "ram-32-ddr5",
        "storage": "ssd-samsung-990pro-2t",
        "psu": "psu-corsair-850",
        "case": "case-air903",
        "cooler": "cooler-ak620"
      },
      "totalPrice": 32540000,
      "estimatedWatts": 447,
      "recommendedPsu": "850W (periksa headroom)"
    }
  ]
};
if (typeof window !== 'undefined') window.PC_DATA = PC_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = PC_DATA;
