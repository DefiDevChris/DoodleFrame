export const TEMPLATES = [
  {
    id: 'phone',
    name: 'Phone',
    // Transparent background, only outline and top bar visible
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600" viewBox="0 0 300 600"><rect x="10" y="10" width="280" height="580" rx="30" ry="30" fill="none" stroke="#333" stroke-width="8"/><rect x="20" y="50" width="260" height="480" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="5,5" opacity="0.5"/><circle cx="150" cy="560" r="15" fill="none" stroke="#333" stroke-width="4"/><rect x="100" y="25" width="100" height="10" rx="5" fill="#333"/></svg>')}`
  },
  {
    id: 'browser',
    name: 'Browser',
    // Transparent background, only top bar and outline
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect x="2" y="2" width="796" height="596" rx="10" fill="none" stroke="#333" stroke-width="4"/><path d="M2 40 h796" stroke="#333" stroke-width="4" fill="none"/><circle cx="30" cy="22" r="6" fill="#ff5f56"/><circle cx="50" cy="22" r="6" fill="#ffbd2e"/><circle cx="70" cy="22" r="6" fill="#27c93f"/><rect x="100" y="10" width="500" height="24" rx="5" fill="none" stroke="#ccc" stroke-width="1"/><rect x="2" y="40" width="796" height="558" fill="none" stroke="#ddd" stroke-width="2" stroke-dasharray="5,5" opacity="0.5"/></svg>')}`
  },
  {
    id: 'tablet',
    name: 'Tablet',
    // Transparent background, only outline and top bar
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect x="10" y="10" width="580" height="780" rx="20" fill="none" stroke="#333" stroke-width="8"/><rect x="30" y="50" width="540" height="700" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="5,5" opacity="0.5"/><circle cx="300" cy="770" r="12" fill="none" stroke="#333" stroke-width="4"/></svg>')}`
  },
  {
    id: 'laptop',
    name: 'Laptop',
    // New laptop template with transparent background
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect x="50" y="20" width="800" height="520" rx="10" fill="none" stroke="#333" stroke-width="6"/><rect x="70" y="40" width="760" height="480" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="5,5" opacity="0.5"/><path d="M20 540 h860 v20 h-860 z" fill="none" stroke="#333" stroke-width="6"/></svg>')}`
  },
  {
    id: 'watch',
    name: 'Watch',
    // New smartwatch template
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="360" viewBox="0 0 200 360"><rect x="20" y="20" width="160" height="240" rx="30" fill="none" stroke="#333" stroke-width="6"/><rect x="35" y="35" width="130" height="210" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="5,5" opacity="0.5"/><rect x="85" y="5" width="30" height="15" rx="3" fill="none" stroke="#333" stroke-width="4"/><rect x="85" y="260" width="30" height="15" rx="3" fill="none" stroke="#333" stroke-width="4"/></svg>')}`
  }
];
