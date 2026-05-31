// Shared wiki chrome. Builds the sidebar nav and marks the active page.
// Page CONTENT lives in each page's HTML — only the sidebar is injected here,
// so a page still renders its body if this script fails to load.
(function () {
  var PAGES = [
    { slug: 'getting-started', label: 'Getting Started' },
    { slug: 'building-a-composition', label: 'Building a composition' },
    { slug: 'loadout-templates', label: 'Loadout templates' },
    { slug: 'bulk-edit', label: 'Bulk edit' },
    { slug: 'google-sheets-export', label: 'Export & import' }
  ];

  var mount = document.getElementById('wiki-sidebar');
  if (!mount) return;

  // Active slug = the wiki folder in the current path, e.g.
  // /AlbionCompBuilder/wiki/bulk-edit/  ->  "bulk-edit"
  var match = location.pathname.match(/\/wiki\/([^/]+)\//);
  var active = match ? match[1] : '';

  var list = document.createElement('ul');
  list.className = 'wiki-nav-list';

  PAGES.forEach(function (page) {
    var li = document.createElement('li');
    var link = document.createElement('a');
    link.href = '../' + page.slug + '/'; // sibling folder, one level up
    link.textContent = page.label;
    link.className = 'wiki-nav-link';
    if (page.slug === active) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
    li.appendChild(link);
    list.appendChild(li);
  });

  mount.appendChild(list);
})();
