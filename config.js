/**
 * Baseline — White-Label Configuration
 *
 * All app pages read from this object. To rebrand, change the values below.
 * The businesses array is extensible — add entries for new businesses.
 */
var BL_CONFIG = {
  // App branding
  appName:      'Baseline',
  appShortName: 'Baseline',
  tagline:      'Daily Command Center',
  ownerName:    'Doug Brown',
  timezone:     'America/New_York',

  // Theme
  themeColor:   '#0f172a',   // slate-900
  accentColor:  '#3b82f6',   // blue-500

  // Businesses
  businesses: [
    {
      key:         'tree',
      name:        'Second Nature Tree Service',
      shortName:   'SNTS',
      email:       'info@peekskilltree.com',
      phone:       '(914) 391-5233',
      color:       '#00836c',
      icon:        'tree-pine',
      supabaseUrl: 'https://ltpivkqahvplapyagljt.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cGl2a3FhaHZwbGFweWFnbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzIsImV4cCI6MjA4OTY3NDE3Mn0.bQ-wAx4Uu-FyA2ZwsTVfFoU2ZPbeWCmupqV-6ZR9uFI',
      type:        'branchmanager'
    },
    {
      key:         'lawn',
      name:        'Smart Lawn NY',
      shortName:   'SLNY',
      email:       'info@smartlawnny.com',
      phone:       '(914) 930-5437',
      color:       '#6abb1e',
      icon:        'leaf',
      supabaseUrl: 'https://hsjodrniizoctxsznjsy.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhzam9kcm5paXpvY3R4c3puanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODkxNzUsImV4cCI6MjA5MDA2NTE3NX0.Yu8JUBc5TQrVr_1XsAVHsr66LiZZrMEgeYZ8dog1VWk',
      type:        'smartlawn'
    },
    {
      key:         'skate',
      name:        '2NTR Skatepark',
      shortName:   '2NTR',
      email:       'doug@2ntr.com',
      phone:       '(914) 391-5233',
      color:       '#e94560',
      icon:        'skateboard',  // fallback: 'zap'
      supabaseUrl: null,
      supabaseKey: null,
      type:        'square',      // future: Square POS integration
      comingSoon:  true
    }
  ],

  // Google OAuth (Phase 2)
  googleClientId: null,

  // Dialpad (Phase 3)
  dialpadApiKey: null
};
