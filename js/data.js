/**
 * Database Komponen PC Terbaru & Preset Rakitan - Nexus PC Builder
 */

const PC_DATA = {
  categories: [
    { id: 'cpu', name: 'Processor (CPU)', icon: 'cpu', required: true },
    { id: 'gpu', name: 'Kartu Grafis (VGA / GPU)', icon: 'monitor', required: true },
    { id: 'motherboard', name: 'Motherboard', icon: 'server', required: true },
    { id: 'ram', name: 'Memori (RAM)', icon: 'hard-drive', required: true },
    { id: 'storage', name: 'Penyimpanan (SSD / HDD)', icon: 'database', required: true },
    { id: 'psu', name: 'Power Supply (PSU)', icon: 'zap', required: true },
    { id: 'case', name: 'Casing PC', icon: 'box', required: true },
    { id: 'cooler', name: 'Pendingin CPU (Cooler)', icon: 'wind', required: false },
    { id: 'accessories', name: 'Aksesoris Tambahan', icon: 'grid', required: false },
    { id: 'software', name: 'Paket Software & OS', icon: 'download', required: false }
  ],

  components: {
    cpu: [
      {
        id: 'cpu-1',
        name: 'Intel Core i5-14400F (10-Cores / 16-Threads up to 4.7GHz)',
        brand: 'Intel',
        socket: 'LGA1700',
        price: 3250000,
        watts: 65,
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        description: 'Processor gaming & produktivitas kelas menengah yang sangat hemat daya dan kencang.'
      },
      {
        id: 'cpu-2',
        name: 'AMD Ryzen 5 7600X (6-Cores / 12-Threads up to 5.3GHz AM5)',
        brand: 'AMD',
        socket: 'AM5',
        price: 3650000,
        watts: 105,
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&auto=format&fit=crop&q=80',
        description: 'Processor AM5 terbaik untuk gaming eSports & AAA 1080p/1440p performa tinggi.'
      },
      {
        id: 'cpu-3',
        name: 'Intel Core i7-14700K (20-Cores / 28-Threads up to 5.6GHz)',
        brand: 'Intel',
        socket: 'LGA1700',
        price: 6850000,
        watts: 125,
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        description: 'Monster produktivitas & gaming high-end untuk live-streaming dan editing 4K.'
      },
      {
        id: 'cpu-4',
        name: 'AMD Ryzen 7 7800X3D (8-Cores / 16-Threads dengan 3D V-Cache)',
        brand: 'AMD',
        socket: 'AM5',
        price: 6450000,
        watts: 120,
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&auto=format&fit=crop&q=80',
        description: 'King of Gaming CPU! Ditenagai teknologi 3D V-Cache untuk FPS maksimal di game AAA.'
      },
      {
        id: 'cpu-5',
        name: 'AMD Ryzen 7 9700X (8-Cores / 16-Threads Next-Gen Zen 5)',
        brand: 'AMD',
        socket: 'AM5',
        price: 6150000,
        watts: 65,
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&auto=format&fit=crop&q=80',
        description: 'Generasi terbaru Zen 5 dengan efisiensi daya luar biasa dan IPC jauh lebih tinggi.'
      },
      {
        id: 'cpu-6',
        name: 'Intel Core i9-14900K (24-Cores / 32-Threads up to 6.0GHz)',
        brand: 'Intel',
        socket: 'LGA1700',
        price: 9950000,
        watts: 253,
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        description: 'Flagship Intel terkencang untuk Workstation berat, 3D Rendering, AI, & Ultimate Gaming.'
      }
    ],

    gpu: [
      {
        id: 'gpu-1',
        name: 'NVIDIA GeForce RTX 4060 8GB GDDR6 (Dual Fan ARGB)',
        brand: 'NVIDIA',
        price: 4650000,
        watts: 115,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Performa DLSS 3 & Frame Generation terbaik untuk gaming 1080p Ultra.'
      },
      {
        id: 'gpu-2',
        name: 'AMD Radeon RX 7600 XT 16GB GDDR6 (Steel Legend)',
        brand: 'AMD',
        price: 5450000,
        watts: 190,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'VRAM jumbo 16GB dengan FSR 3 untuk gaming 1440p dan pembuatan konten tekstur tinggi.'
      },
      {
        id: 'gpu-3',
        name: 'NVIDIA GeForce RTX 4070 Super 12GB GDDR6X (Triple Fan RGB)',
        brand: 'NVIDIA',
        price: 10450000,
        watts: 220,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Sweet spot gaming 1440p Max Settings & Ray Tracing kencang tanpa kompromi.'
      },
      {
        id: 'gpu-4',
        name: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X (Gaming OC)',
        brand: 'NVIDIA',
        price: 18250000,
        watts: 320,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Senjata ampuh untuk gaming 4K rata kanan dan akselerasi AI / Machine Learning.'
      },
      {
        id: 'gpu-5',
        name: 'AMD Radeon RX 7900 XTX 24GB GDDR6 (Nitro+ Vapor Chamber)',
        brand: 'AMD',
        price: 17800000,
        watts: 355,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Flagship RDNA 3 dari AMD dengan VRAM 24GB murni untuk kreasi konten 8K & gaming.'
      },
      {
        id: 'gpu-6',
        name: 'NVIDIA GeForce RTX 4090 24GB GDDR6X (Supreme Liquid Cool / Air)',
        brand: 'NVIDIA',
        price: 33500000,
        watts: 450,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'VGA konsumen terkuat di dunia saat ini. Tanpa batasan FPS di resolusi 4K / 8K.'
      }
    ],

    motherboard: [
      {
        id: 'mb-1',
        name: 'ASUS TUF Gaming B760M-Plus WiFi DDR5 (LGA1700)',
        brand: 'ASUS',
        socket: 'LGA1700',
        price: 2950000,
        watts: 40,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80',
        description: 'Motherboard tahan banting Military Grade dengan WiFi 6E & PCIe 5.0 M.2.'
      },
      {
        id: 'mb-2',
        name: 'MSI MAG B650 Tomahawk WiFi AM5 DDR5',
        brand: 'MSI',
        socket: 'AM5',
        price: 3650000,
        watts: 45,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80',
        description: 'Solusi VRM kuat untuk Ryzen 7000/9000 dengan sistem pendinginan Heatsink tebal.'
      },
      {
        id: 'mb-3',
        name: 'GIGABYTE Z790 AORUS Elite AX Ice DDR5 (LGA1700 White)',
        brand: 'GIGABYTE',
        socket: 'LGA1700',
        price: 4950000,
        watts: 55,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80',
        description: 'Motherboard bertema serba putih dengan VRM 16+1+2 Phase untuk Overclocking.'
      },
      {
        id: 'mb-4',
        name: 'ASRock X670E Taichi Carrara AM5 Flagship',
        brand: 'ASRock',
        socket: 'AM5',
        price: 8450000,
        watts: 60,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80',
        description: 'Motherboard kustom marmer estetis dengan PCIe Gen 5 penuh dan audio DAC ESS SABRE.'
      }
    ],

    ram: [
      {
        id: 'ram-1',
        name: 'Corsair Vengeance RGB 16GB (2x8GB) DDR5 5600MHz CL36',
        brand: 'Corsair',
        price: 1150000,
        watts: 10,
        image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&auto=format&fit=crop&q=80',
        description: 'RAM DDR5 entry gaming cepat dengan pencahayaan RGB dinamis Icue.'
      },
      {
        id: 'ram-2',
        name: 'G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6000MHz CL30 (AMD EXPO / XMP)',
        brand: 'G.Skill',
        price: 2150000,
        watts: 15,
        image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&auto=format&fit=crop&q=80',
        description: 'Timing CL30 terketat & tercepat untuk performa optimal di Ryzen 7000/9000 & Intel.'
      },
      {
        id: 'ram-3',
        name: 'Team T-Force Delta RGB White 64GB (2x32GB) DDR5 6400MHz CL32',
        brand: 'TeamGroup',
        price: 3950000,
        watts: 20,
        image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&auto=format&fit=crop&q=80',
        description: 'Kapasitas raksasa 64GB untuk Multitasking ekstrem, Virtualization, & 3D Render.'
      }
    ],

    storage: [
      {
        id: 'str-1',
        name: 'Kingston NV2 1TB NVMe M.2 PCIe 4.0 SSD (Up to 3500MB/s)',
        brand: 'Kingston',
        price: 980000,
        watts: 5,
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&auto=format&fit=crop&q=80',
        description: 'SSD NVMe hemat anggaran yang cepat untuk OS Windows & pustaka game.'
      },
      {
        id: 'str-2',
        name: 'Samsung 990 PRO 2TB NVMe M.2 PCIe 4.0 SSD (Up to 7450MB/s Heatsink)',
        brand: 'Samsung',
        price: 2850000,
        watts: 8,
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&auto=format&fit=crop&q=80',
        description: 'SSD PCIe 4.0 terkencang dengan Heatsink bawaan untuk loading game kilat & video 4K.'
      },
      {
        id: 'str-3',
        name: 'Crucial T700 2TB NVMe Gen5 SSD (Up to 12,400 MB/s Extreme Speed)',
        brand: 'Crucial',
        price: 4950000,
        watts: 12,
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&auto=format&fit=crop&q=80',
        description: 'Kecepatan Next-Gen PCIe 5.0 hingga 12.400 MB/detik untuk produktivitas tanpa kompromi.'
      }
    ],

    psu: [
      {
        id: 'psu-1',
        name: 'MSI MAG A650BN 650W 80+ Bronze Certified Power Supply',
        brand: 'MSI',
        capacityWatts: 650,
        price: 780000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'PSU Andal 650W 80+ Bronze cocok untuk racikan kelas mid-range RTX 4060 / RX 7600.'
      },
      {
        id: 'psu-2',
        name: 'Corsair RM750e 750W 80+ Gold Fully Modular ATX 3.0 & PCIe 5.0',
        brand: 'Corsair',
        capacityWatts: 750,
        price: 1750000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'PSU Modular 80+ Gold efisien tinggi dengan standar ATX 3.0 & kabel 12VHPWR.'
      },
      {
        id: 'psu-3',
        name: 'Seasonic Focus GX-850 850W 80+ Gold Fully Modular ATX 3.0',
        brand: 'Seasonic',
        capacityWatts: 850,
        price: 2350000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Jaminan Garansi 10 Tahun Seasonic untuk menyuplai RTX 4070 Super / RTX 4080.'
      },
      {
        id: 'psu-4',
        name: 'be quiet! Dark Power 13 1000W 80+ Titanium Fully Modular ATX 3.0',
        brand: 'be quiet!',
        capacityWatts: 1000,
        price: 4650000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'PSU Titanium ultra-senyap dan efisiensi puncak 95%+ untuk sistem rakitan kelas berat.'
      }
    ],

    case: [
      {
        id: 'case-1',
        name: 'Montech AIR 903 MAX Black (4x 140mm ARGB Fans Included)',
        brand: 'Montech',
        price: 1150000,
        watts: 15,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Case Mesh High Airflow dengan 4 kipas bawaan 140mm ARGB super adem.'
      },
      {
        id: 'case-2',
        name: 'HYTE Y60 Panoramic Tempered Glass Dual Chamber Red/Black',
        brand: 'HYTE',
        price: 3250000,
        watts: 10,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Casing akuarium ikonik dengan dudukan VGA vertikal PCIe 4.0 Riser bawaan.'
      },
      {
        id: 'case-3',
        name: 'Lian Li O11 Dynamic EVO RGB Snow White Edition',
        brand: 'Lian Li',
        price: 2750000,
        watts: 10,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
        description: 'Desain dual-chamber mewah dengan strip RGB ambient dan ruang manajemen kabel luas.'
      }
    ],

    cooler: [
      {
        id: 'clr-1',
        name: 'Deepcool AK400 Digital ARGB Air Cooler (Display Temp Real-Time)',
        brand: 'Deepcool',
        price: 580000,
        watts: 5,
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        description: 'Cooler Tower stylish dilengkapi layar LCD digital yang menampilkan temperatur CPU secara live.'
      },
      {
        id: 'clr-2',
        name: 'Thermalright Frozen Prism 240 ARGB Liquid Cooler White',
        brand: 'Thermalright',
        price: 950000,
        watts: 15,
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        description: 'Liquid AIO 240mm dengan efisiensi pendinginan tinggi untuk processor Mid to High end.'
      },
      {
        id: 'clr-3',
        name: 'NZXT Kraken Elite 360 RGB Liquid Cooler dengan Customizable LCD Screen',
        brand: 'NZXT',
        price: 4450000,
        watts: 25,
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        description: 'AIO 360mm premium dengan layar LCD 2.36 inci tajam yang bisa menampilkan GIF & data suhu.'
      }
    ],

    accessories: [
      {
        id: 'acc-1',
        name: 'Lian Li Uni Fan SL-Infinity 120 ARGB Triple Pack Black',
        brand: 'Lian Li',
        price: 1350000,
        watts: 12,
        image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&auto=format&fit=crop&q=80',
        description: 'Fan cermin tak terhingga (Infinity Mirror) dengan kabel daisy-chain yang sangat rapi.'
      },
      {
        id: 'acc-2',
        name: 'Kabel Extension Custom Sleeved Power Supply Full Set (White/Black)',
        brand: 'Nexus Custom',
        price: 350000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&auto=format&fit=crop&q=80',
        description: 'Set kabel jalinan estetik anti-kusut untuk mempercantik tampilan interior PC.'
      },
      {
        id: 'acc-3',
        name: 'Deepcool ST500 ARGB GPU Support Bracket Holder',
        brand: 'Deepcool',
        price: 220000,
        watts: 2,
        image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=300&auto=format&fit=crop&q=80',
        description: 'Penyangga VGA berbahan baja kuat dengan aksen ARGB untuk mengamankan slot PCIe.'
      }
    ],

    software: [
      {
        id: 'soft-1',
        name: 'Paket Basic OS & Office Ready (Gratis / Included)',
        brand: 'Nexus Software',
        price: 0,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=300&auto=format&fit=crop&q=80',
        description: 'Windows 11 Pro Original (Activated), MS Office 2021, PDF Reader, Chrome, WinRAR, & Driver Hardware Terbaru.'
      },
      {
        id: 'soft-2',
        name: 'Paket Pro Gamer & FPS Tuning Optimization',
        brand: 'Nexus Software',
        price: 150000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80',
        description: 'Optimasi Latency Windows, Tuning XMP/EXPO RAM, MSI Afterburner, Discord, Steam, Epic Games, & Benchmark Tools.'
      },
      {
        id: 'soft-3',
        name: 'Paket Creator Workstation & 3D Render Suite',
        brand: 'Nexus Software',
        price: 250000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
        description: 'Setup Adobe Master Collection (Photoshop, Premiere, After Effects), Blender 4.0, DaVinci Resolve, AutoCAD, & CUDA Drivers.'
      },
      {
        id: 'soft-4',
        name: 'Paket Developer Dual-Boot Windows 11 + Linux Ubuntu',
        brand: 'Nexus Software',
        price: 300000,
        watts: 0,
        image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=300&auto=format&fit=crop&q=80',
        description: 'Konfigurasi Dual-Boot OS Windows 11 Pro + Linux Ubuntu 24.04 LTS, Docker Desktop, VS Code, Git, & Python Dev Stack.'
      }
    ]
  },

  presets: [
    {
      id: 'budget-esports',
      title: 'Budget eSports Gaming',
      badge: 'Terpopuler 1080p',
      tagline: 'Performa Cepat untuk Valorant, CS2, Dota 2 & GTA V pada 1080p High FPS.',
      totalPrice: 15490000,
      estimatedWatts: 300,
      recommendedPsu: '650W 80+ Bronze',
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
      components: {
        cpu: 'cpu-1', // Intel i5-14400F
        gpu: 'gpu-1', // RTX 4060 8GB
        motherboard: 'mb-1', // TUF B760M
        ram: 'ram-1', // 16GB DDR5
        storage: 'str-1', // NV2 1TB
        psu: 'psu-1', // MSI 650W
        case: 'case-1', // Montech AIR 903
        cooler: 'clr-1' // Deepcool AK400 Digital
      }
    },
    {
      id: 'amd-streamer-1440p',
      title: 'Ultra 1440p & Streaming Beast',
      badge: 'King of Gaming',
      tagline: 'Ditenagai Ryzen 7 7800X3D + RTX 4070 Super untuk Ray Tracing & Live Streaming 1440p Smooth.',
      totalPrice: 28450000,
      estimatedWatts: 450,
      recommendedPsu: '750W / 850W Gold',
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80',
      components: {
        cpu: 'cpu-4', // Ryzen 7 7800X3D
        gpu: 'gpu-3', // RTX 4070 Super
        motherboard: 'mb-2', // MSI B650 Tomahawk
        ram: 'ram-2', // Trident Z5 32GB
        storage: 'str-2', // 990 Pro 2TB
        psu: 'psu-2', // Corsair RM750e
        case: 'case-3', // Lian Li O11 EVO
        cooler: 'clr-2' // Thermalright 240 AIO
      }
    },
    {
      id: 'creator-4k-beast',
      title: 'Pro Creator & 4K Monster',
      badge: 'Workstation & 4K',
      tagline: 'Kombinasi i9-14900K + RTX 4090 24GB + RAM 64GB DDR5 untuk Render 3D, AI, Blender, & 4K Gaming.',
      totalPrice: 65450000,
      estimatedWatts: 790,
      recommendedPsu: '1000W 80+ Titanium',
      image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
      components: {
        cpu: 'cpu-6', // i9-14900K
        gpu: 'gpu-6', // RTX 4090 24GB
        motherboard: 'mb-3', // Z790 AORUS Elite
        ram: 'ram-3', // 64GB DDR5 6400MHz
        storage: 'str-3', // Crucial T700 2TB Gen5
        psu: 'psu-4', // be quiet 1000W Titanium
        case: 'case-2', // HYTE Y60
        cooler: 'clr-3', // NZXT Kraken 360 LCD
        accessories: 'acc-1' // Lian Li Fans
      }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.PC_DATA = PC_DATA;
}
