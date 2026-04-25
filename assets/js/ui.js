export const STATUS_LABELS = {
  '접수': '모자분리접수',
  'SKB검토중': 'SKB검토',
  '2군진행': 'BP사진행',
  '한전처리중': '한전처리중',
  '완료': '완료',
};

export const STATUS_COLORS = {
  '접수': '#6c757d',
  'SKB검토중': '#0d6efd',
  '2군진행': '#fd7e14',
  '한전처리중': '#dc3545',
  '완료': '#198754',
};

export const TYPE_LABELS = { '신규': '신규', '변경': '변경', '해지': '해지' };
export const ROLE_LABELS = { admin: '관리자', skb_manager: 'SKB담당자', partner_bp: '협력사', requester: '요청자' };

export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatMoney(amount) {
  if (amount == null) return '-';
  return Number(amount).toLocaleString('ko-KR') + '원';
}

export function showToast(message, type = 'success') {
  const existing = document.getElementById('toast-container');
  const container = existing || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

export function showLoading(show = true) {
  let el = document.getElementById('global-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-loading';
    el.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

export function renderStatusBadge(status) {
  const colors = {
    '접수': { bg: 'var(--gray-100)', text: 'var(--gray-600)' },
    'SKB검토중': { bg: 'var(--primary-light)', text: 'var(--primary-dark)' },
    '2군진행': { bg: 'var(--warning-light)', text: 'var(--warning)' },
    '한전처리중': { bg: 'var(--danger-light)', text: 'var(--danger)' },
    '완료': { bg: 'var(--success-light)', text: 'var(--success)' },
  };
  const theme = colors[status] || { bg: '#eee', text: '#666' };
  return `<span class="status-badge" style="background:${theme.bg}; color:${theme.text}; border:1px solid rgba(0,0,0,0.05); padding: 0.25rem 0.75rem; border-radius: 6px;">${STATUS_LABELS[status] || status}</span>`;
}

export function renderTypeBadge(type) {
  const colors = { 
    '신규': { bg: 'var(--primary-light)', text: 'var(--primary-dark)' }, 
    '변경': { bg: 'var(--warning-light)', text: 'var(--warning)' }, 
    '해지': { bg: 'var(--danger-light)', text: 'var(--danger)' } 
  };
  const theme = colors[type] || { bg: '#eee', text: '#666' };
  return `<span class="type-badge" style="background:${theme.bg}; color:${theme.text}; border:1px solid rgba(0,0,0,0.05); padding: 0.25rem 0.75rem; border-radius: 6px;">${TYPE_LABELS[type] || type}</span>`;
}

export function renderRequestCard(req) {
  return `
    <div class="request-card" onclick="location.href='request-detail.html?id=${req.id}'">
      <div class="card-header">
        <span class="request-number">${req.request_number}</span>
        ${renderTypeBadge(req.request_type)}
      </div>
      <div class="card-body">
        <div class="card-row"><b>민원인</b> ${req.requester_name} (${req.requester_org})</div>
        <div class="card-row"><b>한전고번</b> ${req.kepco_number}</div>
        ${req.building_name ? `<div class="card-row"><b>건물명</b> ${req.building_name}</div>` : ''}
        <div class="card-row"><b>접수일</b> ${formatDate(req.created_at)}</div>
      </div>
    </div>
  `;
}

export function renderKanban(requests) {
  const statuses = ['접수', 'SKB검토중', '2군진행', '한전처리중', '완료'];
  const grouped = {};
  statuses.forEach(s => grouped[s] = []);
  requests.forEach(r => { if (grouped[r.status]) grouped[r.status].push(r); });

  return statuses.map(status => `
    <div class="kanban-column">
      <div class="kanban-header" style="border-top:3px solid ${STATUS_COLORS[status]}">
        <span>${STATUS_LABELS[status]}</span>
        <span class="kanban-count">${grouped[status].length}</span>
      </div>
      <div class="kanban-cards">
        ${grouped[status].map(renderRequestCard).join('') || '<div class="empty-col">없음</div>'}
      </div>
    </div>
  `).join('');
}
