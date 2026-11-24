/**
 * ============================================================
 * MAMAS EXPEDITION — KONFIGURASI & KONTEN PERSONAL
 * ============================================================
 * Kamu bisa mengedit seluruh teks surat, pilihan voucher,
 * makna bunga, dan nomor WhatsApp langsung di file ini
 * tanpa perlu menyentuh kode 3D atau animasi.
 */

export const CONFIG = {
  // Nomor WhatsApp tujuan (format internasional tanpa tanda + atau spasi)
  whatsappNumber: '6285219929275',

  // Label stiker pada kotak paket 3D
  parcel: {
    mainLabel: 'pakeett',
    sender: 'MAMAS EXPEDITION',
    recipient: 'UNTUK SAYANG',
    trackingCode: '09062023',
  },

  // Baris log quick boot terminal MamasOS v2
  bootLines: [
    { text: 'MAMASOS v2.0 // EXPEDITION_DISPATCH', type: 'header', delay: 220 },
    { text: '> SCANNING_CURRENT_STATUS...', type: 'muted', delay: 520 },
    { text: '[ERR] PACAR_LAGI_MARAH', type: 'error', delay: 420 },
    { text: '[ERR] AFFECTION_OVERFLOW', type: 'error', delay: 380 },
    { text: '> DEPLOY_PACKAGE --TARGET="SAYANG" --MODE=3D', type: 'cmd', delay: 520 },
    { text: 'PACKING_APOLOGY_AND_FLOWERS...', type: 'fixing', duration: 1000 },
    { text: 'ERROR_PATCH_READY', type: 'success', delay: 280 },
    { text: 'ALL THE LOVE IS DIRECTLY SENT TO YOU', type: 'highlight', delay: 320 },
  ],

  // Isi Surat Permintaan Maaf
  letter: {
    heading: 'minta maaff ya sayang...',
    paragraphs: [
      'minta maaff tadi pagi2 udah bikin kamu badmood gara2 reels kamu ada yang belum aku liatt, itu pure salah aku yang ga nge-scroll ke atass minta maaff yaa babyyy. aku nyesel banget pagi2 jadinya mood kamu udah ga enakk..',
      'lalu juga aku minta maafff soal kamu jadi kepikiran kaya gituu.. harus nutupin sampe harus nahan2 supaya kamu sendiri ngga malu aku minta maaff yaaa sayangg.. aku akan usahakan sekuat kuatnya aku buat buktiin kalo sekarang kamu dapetnya emang benerr..',
      'minta maaaff yaaa sayangg',
    ],
    signoff: '— Mamas 🤍',
  },

  // Copy ending buket (JetBrains Mono, lowercase, baris demi baris)
  bouquetEndingLines: [
    'ini buat kamu ya',
    'no_flower_blooms_as_beautifully_as_you',
  ],

  // 3 Pilihan Voucher Klaim Jajan -> langsung ke WhatsApp
  vouchers: [
    {
      id: 'matcha-frappe',
      title: 'Matcha Frappe',
      emoji: '🍵',
      tag: 'ADEMIN MOOD',
      accent: '#7bc98b',
      description: 'Biar hatinya adem & manis lagi. Mamas siap beliin kapan pun kamu mau.',
      waMessage:
        'Mamas, paket 3D-nya udah aku buka ya. Aku klaim voucher Matcha Frappe buat nebus salahmu! 🍵',
    },
    {
      id: 'sushi-moy',
      title: 'Sushi Moy',
      emoji: '🍣',
      tag: 'MAKAN ENAK',
      accent: '#f59c72',
      description: 'Makan enak bareng tanpa mikir apa-apa. Semua Mamas yang traktir.',
      waMessage:
        'Mamas, paket 3D-nya udah aku buka ya. Aku klaim voucher Sushi Moy, ayo tepatin janjinya! 🍣',
    },
    {
      id: 'mie-sapi',
      title: 'Mie Sapi',
      emoji: '🍜',
      tag: 'COMFORT FOOD',
      accent: '#f4c553',
      description: 'Semangkok comfort food hangat biar keselnya luntur sampai habis.',
      waMessage:
        'Mamas, paket 3D-nya udah aku buka ya. Aku klaim voucher Mie Sapi buat denda baikan! 🍜',
    },
  ],
};
