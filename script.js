(function () {
  const iconPaths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
    users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"></path><circle cx="9.5" cy="7.5" r="3.5"></circle><path d="M17 11a3.5 3.5 0 1 0-1.2-6.8M21 20v-1.5a4 4 0 0 0-2.8-3.8"></path>',
    user: '<circle cx="12" cy="8" r="3.5"></circle><path d="M5 21a7 7 0 0 1 14 0"></path>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path><path d="M8 6h8M8 10h6"></path>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4.5V3h6v1.5M8 9h8M8 13h6M8 17h4"></path>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"></rect><path d="M16 2.5v4M8 2.5v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"></path>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path>',
    wallet: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19a2 2 0 0 1 2 2v14H6a3 3 0 0 1-3-3V7a.5.5 0 0 1 .5-.5Z"></path><path d="M3 8h16M16 14h.01"></path>',
    megaphone: '<path d="m3 11 14-5v12L3 14v-3Z"></path><path d="M17 10h2a2 2 0 0 1 0 4h-2M6 15l1.5 5H11l-1.3-4.1"></path>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 5.8 18l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 12a2 2 0 1 1 0-4h.2A2 2 0 0 0 3 4.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2.5V.3a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.8 8h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.4 3Z" transform="translate(.8 1.7) scale(.93)"></path>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"></path>',
    'chevron-down': '<path d="m6 9 6 6 6-6"></path>',
    'chevron-right': '<path d="m9 18 6-6-6-6"></path>',
    'chevron-left': '<path d="m15 18-6-6 6-6"></path>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"></path>',
    close: '<path d="m6 6 12 12M18 6 6 18"></path>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"></path>',
    'arrow-left': '<path d="m15 18-6-6 6-6M9 12h12"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    more: '<circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle>',
    sparkle: '<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"></path>',
    shield: '<path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6l8-3Z"></path><path d="m8.5 12 2.2 2.2 4.8-5"></path>',
    'log-out': '<path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5"></path>',
    check: '<path d="m5 12 4.5 4.5L19 7"></path>',
    'check-circle': '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16 9"></path>',
    alert: '<path d="M10.3 3.7 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4M12 17h.01"></path>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"></path>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"></path>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"></path>',
    edit: '<path d="m4 16.5-.7 3.7 3.7-.7L18.8 7.7a2.1 2.1 0 0 0-3-3L4 16.5Z"></path><path d="m14.5 6.5 3 3"></path>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"></path>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.5"></circle>',
    link: '<path d="M10 13.8 8.4 15.4a3.4 3.4 0 0 1-4.8-4.8l2.1-2.1a3.4 3.4 0 0 1 4.8 0M14 10.2l1.6-1.6a3.4 3.4 0 0 1 4.8 4.8l-2.1 2.1a3.4 3.4 0 0 1-4.8 0M8.5 15.5l7-7"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.8-4L3 10M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14M21 19v-5h-5"></path>',
    home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9Z"></path><path d="M9 21v-6h6v6"></path>',
    mosque: '<path d="M3 21h18M5 21v-8h14v8M4 13h16M7 13V9l5-4 5 4v4M12 5V2M9 21v-5h6v5"></path><path d="M12 2a1.5 1.5 0 0 1 1.5 1.5H10.5A1.5 1.5 0 0 1 12 2Z"></path>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"></path>',
    external: '<path d="M14 5h5v5M19 5l-8 8"></path><path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"></path>'
  };

  function injectIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (element) {
      const path = iconPaths[element.dataset.icon];
      if (path) element.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24">' + path + '</svg>';
    });
  }

  function detectRole() {
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (['admin', 'guru', 'santri', 'wali_santri'].includes(roleParam)) return roleParam;
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    if (currentPath.includes('/guru/')) return 'guru';
    if (currentPath.includes('/santri/')) return 'santri';
    if (currentPath.includes('/wali/')) return 'wali_santri';
    return 'admin';
  }

  const currentRole = detectRole();
  const dashboardByRole = {
    admin: 'admin/dashboard.html',
    guru: 'guru/dashboard.html',
    santri: 'santri/dashboard.html',
    wali_santri: 'wali/dashboard.html'
  };
  const navigation = {
    admin: [
      { label: 'Overview', items: [{ label: 'Beranda', href: 'admin/dashboard.html', icon: 'grid' }, { label: 'Kalender akademik', href: 'calendar.html?role=admin', icon: 'calendar' }] },
      { label: 'Akademik', items: [{ label: 'Akun pengguna', href: 'admin/akun.html', icon: 'users' }, { label: 'Kelas', href: 'admin/kelas.html', icon: 'book' }, { label: 'Mapel', href: 'admin/mapel.html', icon: 'book' }, { label: 'Penugasan guru', href: 'admin/penugasan-guru.html', icon: 'clipboard' }, { label: 'Relasi wali santri', href: 'admin/wali-santri.html', icon: 'users' }, { label: 'Tugas & submission', href: 'admin/dashboard.html#tugas', icon: 'clipboard', count: '24' }, { label: 'Nilai & kehadiran', href: 'admin/kehadiran.html', icon: 'chart' }, { label: 'Rapor', href: 'admin/rapor.html', icon: 'file' }] },
      { label: 'Pembayaran SPP', items: [{ label: 'Dashboard pembayaran', href: 'admin/pembayaran/dashboard.html', icon: 'wallet', count: '86', group: 'admin/pembayaran/', parent: true }, { label: 'Tarif SPP', href: 'admin/pembayaran/tarif-spp.html', icon: 'settings' }, { label: 'Tagihan', href: 'admin/pembayaran/tagihan.html', icon: 'file' }, { label: 'Transaksi', href: 'admin/pembayaran/transaksi.html', icon: 'chart' }, { label: 'Pengaturan pembayaran', href: 'admin/pembayaran/pengaturan.html', icon: 'settings' }] },
      { label: 'Layanan pesantren', items: [{ label: 'Pengumuman', href: 'admin/pengumuman.html', icon: 'megaphone' }, { label: 'Pengaturan', href: 'admin/pengaturan.html', icon: 'settings' }, { label: 'Log aktivitas', href: 'admin/log-aktivitas.html', icon: 'shield' }] }
    ],
    guru: [
      { label: 'Workspace', items: [{ label: 'Dashboard', href: 'guru/dashboard.html', icon: 'grid' }, { label: 'Kalender akademik', href: 'calendar.html?role=guru', icon: 'calendar' }] },
      { label: 'Kegiatan mengajar', items: [{ label: 'Input nilai', href: 'guru/nilai.html', icon: 'chart' }, { label: 'Kehadiran', href: 'guru/kehadiran.html', icon: 'users' }, { label: 'Tugas & submission', href: 'guru/tugas/index.html', icon: 'clipboard', count: '12', group: 'guru/tugas/', parent: true }, { label: 'Rapor', href: 'guru/rapor.html', icon: 'file' }] },
      { label: 'Akun', items: [{ label: 'Pengumuman', href: 'admin/pengumuman.html?role=guru', icon: 'megaphone' }, { label: 'Keluar', href: 'login.html', icon: 'log-out' }] }
    ],
    santri: [
      { label: 'Workspace', items: [{ label: 'Dashboard', href: 'santri/dashboard.html', icon: 'grid' }, { label: 'Kalender akademik', href: 'calendar.html?role=santri', icon: 'calendar' }] },
      { label: 'Belajar', items: [{ label: 'Tugas saya', href: 'santri/tugas/index.html', icon: 'clipboard', count: '4', group: 'santri/tugas/', parent: true }, { label: 'Nilai', href: 'santri/nilai.html', icon: 'chart' }, { label: 'Kehadiran', href: 'santri/kehadiran.html', icon: 'users' }, { label: 'Rapor', href: 'santri/rapor.html', icon: 'file' }] },
      { label: 'Keuangan', items: [{ label: 'Pembayaran SPP', href: 'santri/pembayaran/tagihan.html', icon: 'wallet', group: 'santri/pembayaran/', parent: true }, { label: 'Riwayat pembayaran', href: 'santri/pembayaran/riwayat.html', icon: 'clock' }] },
      { label: 'Akun', items: [{ label: 'Pengumuman', href: 'admin/pengumuman.html?role=santri', icon: 'megaphone' }, { label: 'Keluar', href: 'login.html', icon: 'log-out' }] }
    ],
    wali_santri: [
      { label: 'Workspace', items: [{ label: 'Dashboard', href: 'wali/dashboard.html', icon: 'grid' }, { label: 'Kalender akademik', href: 'calendar.html?role=wali_santri', icon: 'calendar' }] },
      { label: 'Pantau anak', items: [{ label: 'Nilai anak', href: 'wali/nilai.html', icon: 'chart' }, { label: 'Kehadiran anak', href: 'wali/kehadiran.html', icon: 'users' }, { label: 'Rapor anak', href: 'wali/rapor.html', icon: 'file' }] },
      { label: 'Keuangan', items: [{ label: 'Pembayaran SPP', href: 'wali/pembayaran/tagihan.html', icon: 'wallet', group: 'wali/pembayaran/', parent: true }, { label: 'Riwayat pembayaran', href: 'wali/pembayaran/riwayat.html', icon: 'clock' }] },
      { label: 'Akun', items: [{ label: 'Pengumuman', href: 'admin/pengumuman.html?role=wali_santri', icon: 'megaphone' }, { label: 'Keluar', href: 'login.html', icon: 'log-out' }] }
    ]
  };

  function ensureAttendanceExplorer() {
    if (!window.location.pathname.includes('/kehadiran.html') || document.getElementById('attendanceExplorer')) return;
    const headingActions = document.querySelector('.page-heading .page-actions');
    const metricGrid = document.querySelector('.metric-grid');
    if (!headingActions || !metricGrid) return;

    const toggle = document.createElement('button');
    toggle.className = 'button button-secondary';
    toggle.type = 'button';
    toggle.dataset.toggleTarget = 'attendanceExplorer';
    toggle.dataset.closedLabel = 'Lihat keseluruhan';
    toggle.dataset.openLabel = 'Tutup keseluruhan';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span data-icon="plus"></span><span class="toggle-label">Lihat keseluruhan</span>';
    headingActions.insertBefore(toggle, headingActions.firstChild);

    const isTeacher = currentRole === 'guru';
    const isGuardian = currentRole === 'wali_santri';
    const explorer = document.createElement('section');
    explorer.className = 'panel attendance-explorer';
    explorer.id = 'attendanceExplorer';
    explorer.setAttribute('aria-labelledby', 'attendanceExplorerTitle');
    explorer.innerHTML = '<div class="panel-header"><div><h2 class="panel-title" id="attendanceExplorerTitle">Kehadiran lengkap ' + (isGuardian ? 'anak' : isTeacher ? 'kelas' : 'saya') + '</h2><p class="panel-subtitle">Geser rentang tanggal untuk melihat catatan harian</p></div><span class="role-chip" data-period-label>Pekan 02 - 08 Februari 2026</span></div><div class="attendance-explorer-body"><div class="attendance-toolbar"><div class="period-toggle" data-period-switch data-period-target="attendanceExplorer"><button class="period-button active" type="button" data-period-label="Pekan 02 - 08 Februari 2026">Minggu</button><button class="period-button" type="button" data-period-label="Februari 2026">Bulan</button></div><div class="toolbar-right">' + (isGuardian ? '<select class="select-control" aria-label="Pilih anak"><option>Aisyah Fitria</option><option>Maya Salsabila</option></select>' : '') + '<select class="select-control attendance-month-select" data-attendance-target="attendanceExplorer" aria-label="Pilih bulan"><option value="2026-02">Februari 2026</option><option value="2026-01">Januari 2026</option><option value="2025-12">Desember 2025</option></select></div></div><div class="attendance-explorer-grid"><div><div class="attendance-scroll"><div class="attendance-strip" data-attendance-strip data-month="2026-02"></div></div><div class="attendance-scroll-caption"><span data-icon="chevron-right"></span><span>Geser ke kanan untuk melihat seluruh hari pada <strong data-month-label>Februari 2026</strong>.</span></div></div><div><div class="attendance-overview-box"><div class="attendance-overview-heading"><strong>' + (isTeacher ? 'Kehadiran santri' : isGuardian ? 'Kehadiran anak' : 'Kehadiran saya') + '</strong><span>' + (isTeacher ? '118 santri' : isGuardian ? 'Aisyah Fitria' : 'Ibtida A') + '</span></div><div class="attendance-status-list"><div class="attendance-status-line"><i class="present"></i><span>Hadir</span><strong>' + (isTeacher ? '94,8%' : '97,2%') + '</strong></div><div class="attendance-status-line"><i class="permit"></i><span>Izin</span><strong>1,8%</strong></div><div class="attendance-status-line"><i class="sick"></i><span>Sakit</span><strong>1,3%</strong></div><div class="attendance-status-line"><i class="absent"></i><span>Alpa</span><strong>' + (isTeacher ? '2,1%' : '0%') + '</strong></div></div></div>' + (isTeacher ? '<div class="attendance-scope" style="margin-top:10px"><strong>Kehadiran saya</strong><p>38 hadir mengajar dari 40 jadwal pada semester ini.</p><span class="status-badge success">95% hadir</span></div>' : '<div class="attendance-scope" style="margin-top:10px"><strong>' + (isGuardian ? 'Akses wali santri' : 'Data pribadi') + '</strong><p>' + (isGuardian ? 'Hanya kehadiran anak yang terhubung dengan akun ini.' : 'Hanya kamu yang dapat melihat rekap kehadiran ini.') + '</p><span class="status-badge success">Data tersedia</span></div>') + '</div></div><div class="attendance-matrix-wrap" style="margin-top:20px"><table class="data-table attendance-matrix"><thead><tr><th>' + (isTeacher ? 'Santri / kelas' : isGuardian ? 'Anak / kelas' : 'Tanggal') + '</th><th>Sen 02</th><th>Sel 03</th><th>Rab 04</th><th>Kam 05</th><th>Jum 06</th><th>Sab 07</th><th>Rekap</th></tr></thead><tbody><tr><td><strong>' + (isTeacher ? 'Aisyah Fitria' : isGuardian ? 'Aisyah Fitria' : 'Pekan ini') + '</strong><span class="person-meta">' + (isTeacher || isGuardian ? 'Ibtida A' : '02 - 08 Februari 2026') + '</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell permit">I</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell present">H</span></td><td>5 hadir, 1 izin</td></tr>' + (isTeacher ? '<tr><td><strong>Fauzan Ramadhan</strong><span class="person-meta">Tsanawiyah 1</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell absent">A</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell present">H</span></td><td><span class="attendance-cell present">H</span></td><td>5 hadir, 1 alpa</td></tr>' : '') + '</tbody></table></div><div class="attendance-matrix-legend"><span><i class="present"></i>H Hadir</span><span><i class="permit"></i>I Izin</span><span><i class="sick"></i>S Sakit</span><span><i class="absent"></i>A Alpa</span></div></div></section>';
    const periodToggle = explorer.querySelector('.period-toggle');
    if (periodToggle) periodToggle.remove();
    const periodLabel = explorer.querySelector('[data-period-label]');
    if (periodLabel) periodLabel.textContent = 'Februari 2026';
    metricGrid.insertAdjacentElement('afterend', explorer);
  }

  function renderNavigation() {
    const sidebarNav = document.querySelector('.sidebar nav');
    if (!sidebarNav) return;
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    const roleNavigation = navigation[currentRole];
    const hasPageItem = roleNavigation.some(function (section) {
      return section.items.some(function (item) { return new URL(item.href, document.baseURI).pathname.replace(/\\/g, '/') === currentPath; });
    });
    sidebarNav.innerHTML = roleNavigation.map(function (section, sectionIndex) {
      const sectionId = 'nav-' + currentRole + '-' + sectionIndex;
      const items = section.items.map(function (item) {
        const targetUrl = new URL(item.href, document.baseURI);
        const targetPath = targetUrl.pathname.replace(/\\/g, '/');
        const isExactPage = targetPath === currentPath && targetUrl.hash === window.location.hash;
        const isActive = isExactPage || (item.parent && item.group && !hasPageItem && currentPath.includes('/' + item.group));
        return '<li><a class="nav-link' + (isActive ? ' active' : '') + '" href="' + item.href + '"' + (isActive ? ' aria-current="page"' : '') + '><span class="nav-icon" data-icon="' + item.icon + '"></span>' + item.label + (item.count ? '<span class="nav-count">' + item.count + '</span>' : '') + '</a></li>';
      }).join('');
      return '<section class="nav-section" aria-labelledby="' + sectionId + '"><h2 class="nav-label" id="' + sectionId + '">' + section.label + '</h2><ul class="nav-list">' + items + '</ul></section>';
    }).join('');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.setAttribute('aria-label', 'Navigasi ' + (currentRole === 'wali_santri' ? 'wali santri' : currentRole));
  }

  ensureAttendanceExplorer();
  document.querySelectorAll('.attendance-explorer .period-toggle').forEach(function (toggle) { toggle.remove(); });
  document.querySelectorAll('.attendance-explorer [data-period-label]').forEach(function (label) { label.textContent = 'Februari 2026'; });
  document.querySelectorAll('.attendance-scope p').forEach(function (text) { text.textContent = text.textContent.replace('Pekan 02 - 08 Februari 2026', 'Februari 2026'); });
  document.querySelectorAll('.page-description').forEach(function (text) { text.textContent = text.textContent.replace('periode minggu atau bulan', 'periode bulanan'); });
  renderNavigation();
  injectIcons();
  if (currentRole !== 'admin') document.querySelectorAll('[data-admin-only]').forEach(function (element) { element.remove(); });

  function renderAttendanceStrip(strip) {
    const parts = (strip.dataset.month || '2026-02').split('-').map(Number);
    const year = parts[0];
    const month = parts[1];
    const startDay = 1;
    const dayCount = new Date(year, month, 0).getDate();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const statuses = ['present', 'present', 'present', 'permit', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'sick', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'present', 'present', 'present', 'present', 'permit', 'present', 'present', 'present', 'present', 'present', 'present'];
    strip.innerHTML = Array.from({ length: dayCount }, function (_, index) {
      const day = index + startDay;
      const date = new Date(year, month - 1, day);
      const status = statuses[index % statuses.length];
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const current = day === 9 && month === 2;
      return '<div class="attendance-day' + (weekend ? ' weekend' : '') + (current ? ' current' : '') + '"><span>' + String(day).padStart(2, '0') + '</span><small>' + dayNames[date.getDay()] + '</small><i class="attendance-day-mark ' + status + '"></i></div>';
    }).join('');
  }

  function renderAttendanceMatrix(table) {
    const strip = table.closest('.attendance-explorer')?.querySelector('[data-attendance-strip]');
    const month = table.dataset.month || strip?.dataset.month || '2026-02';
    const parts = month.split('-').map(Number);
    const year = parts[0];
    const monthNumber = parts[1];
    const dayCount = new Date(year, monthNumber, 0).getDate();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const statuses = ['present', 'present', 'present', 'present', 'permit', 'present', 'present', 'present', 'present', 'present', 'sick', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'present', 'present', 'present', 'permit', 'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present'];
    const letters = { present: 'H', permit: 'I', sick: 'S', absent: 'A' };
    const header = table.querySelector('thead tr');
    const bodyRows = table.querySelectorAll('tbody tr');
    if (!header) return;
    const leadHeader = header.firstElementChild?.textContent || 'Santri / kelas';
    header.innerHTML = '<th>' + leadHeader + '</th>' + Array.from({ length: dayCount }, function (_, index) {
      const day = index + 1;
      const date = new Date(year, monthNumber - 1, day);
      return '<th><span>' + String(day).padStart(2, '0') + '</span><small>' + dayNames[date.getDay()] + '</small></th>';
    }).join('') + '<th>Rekap</th>';
    bodyRows.forEach(function (row, rowIndex) {
      const firstCell = row.firstElementChild;
      if (!firstCell) return;
      const label = firstCell.innerHTML.replace('Pekan ini', 'Bulan terpilih');
      let present = 0;
      let permit = 0;
      let sick = 0;
      let absent = 0;
      const cells = Array.from({ length: dayCount }, function (_, index) {
        const day = index + 1;
        const date = new Date(year, monthNumber - 1, day);
        if (date.getDay() === 0) return '<td>-</td>';
        const status = statuses[(index + rowIndex * 2) % statuses.length];
        if (status === 'present') present += 1;
        if (status === 'permit') permit += 1;
        if (status === 'sick') sick += 1;
        if (status === 'absent') absent += 1;
        return '<td><span class="attendance-cell ' + status + '">' + letters[status] + '</span></td>';
      }).join('');
      const recap = [present ? present + ' hadir' : '', permit ? permit + ' izin' : '', sick ? sick + ' sakit' : '', absent ? absent + ' alpa' : ''].filter(Boolean).join(', ');
      row.innerHTML = '<td>' + label + '</td>' + cells + '<td>' + (recap || 'Belum ada pertemuan') + '</td>';
    });
  }

  document.querySelectorAll('[data-attendance-strip]').forEach(renderAttendanceStrip);
  document.querySelectorAll('.attendance-explorer .attendance-matrix').forEach(renderAttendanceMatrix);

  document.querySelectorAll('.attendance-month-select').forEach(function (select) {
    select.addEventListener('change', function () {
      const target = document.getElementById(select.dataset.attendanceTarget);
      if (!target) return;
      const strip = target.querySelector('[data-attendance-strip]');
      if (strip) {
        strip.dataset.month = select.value;
        renderAttendanceStrip(strip);
      }
      const option = select.options[select.selectedIndex];
      const label = target.querySelector('[data-month-label]');
      if (label) label.textContent = option.textContent;
      const periodLabel = target.querySelector('[data-period-label]');
      if (periodLabel) periodLabel.textContent = option.textContent;
      target.querySelectorAll('.attendance-scope p').forEach(function (text) { text.textContent = text.textContent.replace(/(?:Januari|Februari|Desember) \d{4}/, option.textContent); });
      const matrix = target.querySelector('.attendance-matrix');
      if (matrix) {
        matrix.dataset.month = select.value;
        renderAttendanceMatrix(matrix);
      }
    });
  });

  document.querySelectorAll('.attendance-class-select').forEach(function (select) {
    select.addEventListener('change', function () {
      const target = document.getElementById(select.dataset.attendanceTarget);
      if (!target) return;
      target.querySelectorAll('[data-attendance-class]').forEach(function (row) {
        row.classList.toggle('is-hidden', select.value !== 'all' && row.dataset.attendanceClass !== select.value);
      });
    });
  });

  const routeMap = {
    'index.html': 'admin/dashboard.html',
    'admin-akun.html': 'admin/akun.html',
    'admin-kelas.html': 'admin/kelas.html',
    'admin-mapel.html': 'admin/mapel.html',
    'admin-penugasan-guru.html': 'admin/penugasan-guru.html',
    'admin-wali-santri.html': 'admin/wali-santri.html',
    'admin-pengumuman.html': 'admin/pengumuman.html',
    'admin-rapor.html': 'admin/rapor.html',
    'admin-log-aktivitas.html': 'admin/log-aktivitas.html',
    'admin-pengaturan.html': 'admin/pengaturan.html',
    'admin-pembayaran.html': 'admin/pembayaran/dashboard.html',
    'admin-tarif-spp.html': 'admin/pembayaran/tarif-spp.html',
    'admin-tagihan.html': 'admin/pembayaran/tagihan.html',
    'admin-transaksi.html': 'admin/pembayaran/transaksi.html',
    'admin-pengaturan-pembayaran.html': 'admin/pembayaran/pengaturan.html',
    'guru-dashboard.html': 'guru/dashboard.html',
    'guru-nilai.html': 'guru/nilai.html',
    'guru-kehadiran.html': 'guru/kehadiran.html',
    'guru-tugas.html': 'guru/tugas/index.html',
    'guru-tugas-baru.html': 'guru/tugas/baru.html',
    'guru-submission.html': 'guru/tugas/submission.html',
    'guru-rapor.html': 'guru/rapor.html',
    'santri-dashboard.html': 'santri/dashboard.html',
    'santri-tugas.html': 'santri/tugas/index.html',
    'santri-tugas-detail.html': 'santri/tugas/detail.html',
    'santri-nilai.html': 'santri/nilai.html',
    'santri-kehadiran.html': 'santri/kehadiran.html',
    'santri-rapor.html': 'santri/rapor.html',
    'santri-pembayaran-tagihan.html': 'santri/pembayaran/tagihan.html',
    'santri-pembayaran-riwayat.html': 'santri/pembayaran/riwayat.html',
    'wali-dashboard.html': 'wali/dashboard.html',
    'wali-nilai.html': 'wali/nilai.html',
    'wali-kehadiran.html': 'wali/kehadiran.html',
    'wali-rapor.html': 'wali/rapor.html',
    'wali-pembayaran-tagihan.html': 'wali/pembayaran/tagihan.html',
    'wali-pembayaran-riwayat.html': 'wali/pembayaran/riwayat.html'
  };

  document.querySelectorAll('a[href]').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|javascript:|data:)/.test(href)) return;
    if (href === 'index.html') {
      link.setAttribute('href', dashboardByRole[currentRole]);
      return;
    }
    if (href === 'calendar.html') {
      link.setAttribute('href', 'calendar.html?role=' + currentRole);
      return;
    }
    const parts = href.split('#');
    const destination = routeMap[parts[0]];
    if (destination) link.setAttribute('href', destination + (parts[1] ? '#' + parts[1] : ''));
  });

  document.querySelectorAll('use[href^="#icon-"]').forEach(function (use) {
    use.setAttribute('href', window.location.href.split('#')[0] + use.getAttribute('href'));
  });

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuButton = document.getElementById('menuButton');
  const notificationButton = document.getElementById('notificationButton');
  const notificationPopover = document.getElementById('notificationPopover');
  const profileButton = document.getElementById('profileButton');
  const profilePopover = document.getElementById('profilePopover');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimer;

  function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  function closePopovers() {
    if (notificationPopover) notificationPopover.classList.remove('open');
    if (profilePopover) profilePopover.classList.remove('open');
    if (notificationButton) notificationButton.setAttribute('aria-expanded', 'false');
    if (profileButton) profileButton.setAttribute('aria-expanded', 'false');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
  }

  if (menuButton && sidebar && overlay) {
    menuButton.addEventListener('click', function () {
      const isOpen = sidebar.classList.toggle('open');
      overlay.classList.toggle('open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      closePopovers();
    });
    overlay.addEventListener('click', closeSidebar);
  }

  if (notificationButton && notificationPopover) {
    notificationButton.addEventListener('click', function () {
      const isOpen = notificationPopover.classList.toggle('open');
      if (profilePopover) profilePopover.classList.remove('open');
      notificationButton.setAttribute('aria-expanded', String(isOpen));
      if (profileButton) profileButton.setAttribute('aria-expanded', 'false');
    });
  }

  if (profileButton && profilePopover) {
    profileButton.addEventListener('click', function () {
      const isOpen = profilePopover.classList.toggle('open');
      if (notificationPopover) notificationPopover.classList.remove('open');
      profileButton.setAttribute('aria-expanded', String(isOpen));
      if (notificationButton) notificationButton.setAttribute('aria-expanded', 'false');
    });
  }

  const markReadButton = document.getElementById('markReadButton');
  if (markReadButton) {
    markReadButton.addEventListener('click', function () {
      document.querySelectorAll('.notification-item').forEach(function (item) { item.classList.add('read'); });
      const dot = document.querySelector('.notification-dot');
      if (dot) dot.style.display = 'none';
      showToast('Semua notifikasi ditandai sudah dibaca.');
    });
  }

  const yearSelect = document.getElementById('yearSelect');
  if (yearSelect) {
    yearSelect.addEventListener('change', function () {
      showToast('Tahun ajaran diubah ke ' + this.value + '.');
    });
  }

  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      document.querySelectorAll('.nav-link').forEach(function (item) { item.classList.remove('active'); });
      link.classList.add('active');
      closeSidebar();
    });
  });

  const tabs = document.querySelectorAll('.tab-button[data-filter]');
  const taskRows = document.querySelectorAll('.task-row');
  const emptyTask = document.getElementById('emptyTask');
  if (tabs.length && taskRows.length && emptyTask) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const filter = tab.dataset.filter;
        tabs.forEach(function (item) {
          const isActive = item === tab;
          item.classList.toggle('active', isActive);
          item.setAttribute('aria-selected', String(isActive));
        });
        let visibleCount = 0;
        taskRows.forEach(function (row) {
          const visible = filter === 'all' || row.dataset.taskStatus === filter;
          row.style.display = visible ? '' : 'none';
          if (visible) visibleCount += 1;
        });
        emptyTask.classList.toggle('show', visibleCount === 0);
      });
    });
  }

  document.querySelectorAll('[data-filter-target]').forEach(function (control) {
    control.addEventListener('input', function () {
      const query = control.value.toLowerCase().trim();
      const target = document.getElementById(control.dataset.filterTarget);
      if (!target) return;
      target.querySelectorAll('[data-filter-text]').forEach(function (item) {
        item.closest('[data-filter-row]')?.classList.toggle('is-hidden', query && !item.dataset.filterText.toLowerCase().includes(query));
      });
    });
  });

  document.querySelectorAll('[data-toggle-target]').forEach(function (control) {
    control.addEventListener('click', function () {
      const target = document.getElementById(control.dataset.toggleTarget);
      if (!target) return;
      const isOpen = target.classList.toggle('is-open');
      control.setAttribute('aria-expanded', String(isOpen));
      const label = control.querySelector('.toggle-label');
      if (label) label.textContent = isOpen ? (control.dataset.openLabel || 'Tutup keseluruhan') : (control.dataset.closedLabel || 'Lihat keseluruhan');
    });
  });

  document.querySelectorAll('[data-toast]').forEach(function (element) {
    element.addEventListener('click', function (event) {
      const target = element.getAttribute('href');
      if (target && target.charAt(0) === '#') event.preventDefault();
      showToast(element.dataset.toast);
    });
  });

  document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      if (button) {
        button.disabled = true;
        button.classList.add('is-loading');
      }
      window.setTimeout(function () {
        if (button) {
          button.disabled = false;
          button.classList.remove('is-loading');
        }
        showToast(form.dataset.success || 'Perubahan berhasil disimpan.');
      }, 550);
    });
  });

  const loginForm = document.querySelector('[data-login-form]');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const button = loginForm.querySelector('[type="submit"]');
      const role = loginForm.querySelector('[name="role"]')?.value || 'admin';
      const destinations = {
        admin: 'admin/dashboard.html',
        guru: 'guru/dashboard.html',
        santri: 'santri/dashboard.html',
        wali_santri: 'wali/dashboard.html'
      };
      if (button) {
        button.disabled = true;
        button.classList.add('is-loading');
      }
      window.setTimeout(function () { window.location.href = destinations[role] || 'index.html'; }, 450);
    });
  }

  document.querySelectorAll('[data-password-toggle]').forEach(function (control) {
    control.addEventListener('click', function () {
      const input = document.getElementById(control.dataset.passwordToggle);
      if (!input) return;
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      control.textContent = visible ? 'Lihat' : 'Sembunyikan';
    });
  });

  const searchButton = document.getElementById('searchButton');
  if (searchButton) searchButton.addEventListener('click', function () { showToast('Pencarian global tersedia pada versi aplikasi berikutnya.'); });

  document.addEventListener('click', function (event) {
    if (notificationPopover && notificationButton && profilePopover && profileButton && !notificationPopover.contains(event.target) && !notificationButton.contains(event.target) && !profilePopover.contains(event.target) && !profileButton.contains(event.target)) closePopovers();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      event.preventDefault();
      showToast('Pencarian global tersedia pada versi aplikasi berikutnya.');
    }
    if (event.key === 'Escape') {
      closePopovers();
      closeSidebar();
    }
  });
}());
