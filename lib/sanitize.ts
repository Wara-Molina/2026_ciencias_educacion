// lib/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (
  html: string, 
  options?: {
    allowLinks?: boolean;
    forceBlankTarget?: boolean;
    allowAria?: boolean;
  }
): string => {
  // ✅ 1. VALIDAR INPUT
  if (!html || typeof html !== 'string') {
    return '';
  }

  // ✅ 2. CONFIGURACIÓN DE SEGURIDAD (sin tipo explícito)
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'span', 'div', 'section', 'article',
      'blockquote', 'code', 'pre', 'small', 'sub', 'sup',
    ],
    
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title', 'datetime', 'cite', 'lang', 'dir',
    ],
    
    ADD_ATTR: ['target', 'rel'] as string[],
    
    FORBID_TAGS: [
      'script', 'style', 'iframe', 'object', 'embed', 
      'form', 'input', 'button', 'textarea', 'select',
      'link', 'meta', 'base', 'svg', 'math', 'template',
    ],
    
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
      'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
      'onkeydown', 'onkeypress', 'onkeyup', 'ondblclick',
      'oncontextmenu', 'onwheel', 'ondrag', 'ondragend',
      'ondragenter', 'ondragleave', 'ondragover', 'ondragstart',
      'ondrop', 'onmousedown', 'onmouseenter', 'onmouseleave',
      'onmousemove', 'onmouseout', 'onmouseup', 'oncopy',
      'oncut', 'onpaste', 'onscroll', 'oninput', 'oninvalid',
      'style', 'srcdoc', 'srcset', 'formaction',
    ],
    
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    SAFE_FOR_TEMPLATES: true,
  };

  // ✅ 3. SANITIZAR HTML
  try {
    const sanitized = DOMPurify.sanitize(html, config);
    
    // ✅ CONVERTIR a string
    const sanitizedString = typeof sanitized === 'string' 
      ? sanitized 
      : String(sanitized);
    
    // ✅ 4. POST-PROCESAMIENTO: Forzar rel="noopener noreferrer"
    if (typeof window !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedString, 'text/html');
      const links = doc.querySelectorAll('a[target="_blank"]');
      
      links.forEach(link => {
        const rel = link.getAttribute('rel') || '';
        const relValues = new Set(rel.split(' ').filter(Boolean));
        relValues.add('noopener');
        relValues.add('noreferrer');
        link.setAttribute('rel', Array.from(relValues).join(' '));
      });
      
      return doc.body.innerHTML;
    }
    
    return sanitizedString;
  } catch (error) {
    console.error('❌ Error sanitizando HTML:', error);
    return '';
  }
};

export const sanitizeHTMLStrict = (html: string): string => {
  return sanitizeHTML(html, {
    allowLinks: false,
    forceBlankTarget: false,
    allowAria: false,
  });
};

export const sanitizeUserContent = (html: string): string => {
  return sanitizeHTML(html, {
    allowLinks: true,
    forceBlankTarget: true,
    allowAria: false,
  });
};

export const extractPlainText = (html: string): string => {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, '').trim();
  }
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

export const isHTML = (str: string): boolean => {
  const htmlPattern = /<[a-z][\s\S]*>/i;
  return htmlPattern.test(str);
};

export const sanitizeHref = (href: string | null | undefined): string => {
  if (!href) return '';
  
  const trimmed = href.trim();
  
  const allowedProtocols = [
    'http://', 'https://', 'mailto:', 'tel:', '/', '#',
  ];
  
  const isAllowed = allowedProtocols.some(protocol => 
    trimmed.toLowerCase().startsWith(protocol)
  );
  
  if (!isAllowed) {
    console.warn('⚠️ URL bloqueada:', href);
    return '';
  }
  
  const dangerousPatterns = [
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /livescript:/i,
    /expression\(/i,
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(trimmed))) {
    console.warn('⚠️ URL peligrosa bloqueada:', href);
    return '';
  }
  
  return trimmed;
};

export default sanitizeHTML;