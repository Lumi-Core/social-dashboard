
const Analytics = {
    data: null,
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) this.init();
        this.loadAnalytics();
    },

    bindEvents() {
        on('refreshAnalytics',    'click', () => this.loadAnalytics());
        on('exportAnalyticsReport','click', () => this.exportReport());
        on('loadBestTimesBtn',    'click', () => this.loadBestTimes());
        on('loadTagsAnalyticsBtn','click', () => this.loadTagsAnalytics());
        on('openCompareModalBtn', 'click', () => openModal('compareModal'));
        on('runCompareBtn',       'click', () => this.runCompareFromModal());
        on('comparePeriodsBtn',   'click', () => this.comparePeriods());

        // Close compare modal
        on('closeCompareModal', 'click', () => closeModal('compareModal'));
        const cModal = document.getElementById('compareModal');
        if (cModal) {
            const overlay = cModal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', () => closeModal('compareModal'));
        }
    },

    async loadAnalytics() {
        try {
            showLoading('Analyzing Instagram performance...');
            this.data = await api.getAnalyticsFullReport();

            this.renderKPIs(this.data.summary);
            this.renderEngagementBreakdown(this.data.engagement);
            this.renderContentFormatPerformance(this.data.formats);
            this.renderPostingInsights(this.data.posting);
            this.renderTopPerformingPosts(this.data.top_posts);
            this.renderAudienceInsights(this.data.audience);
            this.renderRecommendations(this.data.recommendations);

            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load analytics: ${error.message}`, 'error');
        }
    },

    renderKPIs(s) {
        const kpiGrid = $('analyticsKPIGrid');
        if (!kpiGrid) return;

        const engRate = s.engagement_rate || 0;
        const saveRate = s.save_rate || 0;
        const avgReach = s.avg_reach_per_post || 0;
        const avgViews = s.avg_views_per_post || 0;
        const totalPosts = s.total_posts || 0;
        const totalInteractions = s.total_interactions || 0;
        const totalReach = s.total_reach || 0;
        const totalViews = s.total_views || 0;
        const viewEngRatio = totalViews > 0 ? ((totalInteractions / totalViews) * 100).toFixed(2) : 0;
        const bf = s.best_format;

        let engBenchmark = 'below-average';
        if (engRate >= 6) engBenchmark = 'excellent';
        else if (engRate >= 3) engBenchmark = 'good';
        else if (engRate >= 1.5) engBenchmark = 'average';

        const _bl = (l) => ({ excellent:'Excellent', good:'Good', average:'Average', 'below-average':'Needs Work' }[l] || '');

        kpiGrid.innerHTML = `
            <div class="analytics-kpi-card ${engBenchmark}">
                <div class="kpi-header">
                    <div class="kpi-icon engagement"><i class="fas fa-chart-line"></i></div>
                    <div class="kpi-benchmark-badge ${engBenchmark}">${_bl(engBenchmark)}</div>
                </div>
                <div class="kpi-value">${engRate}%</div>
                <div class="kpi-label">Engagement Rate</div>
                <div class="kpi-detail">
                    <span>${formatNumber(totalInteractions)} interactions</span>
                    <span>from ${formatNumber(totalReach)} reach</span>
                </div>
                <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${Math.min(engRate*10,100)}%"></div></div>
            </div>
            <div class="analytics-kpi-card">
                <div class="kpi-header"><div class="kpi-icon reach"><i class="fas fa-broadcast-tower"></i></div></div>
                <div class="kpi-value">${formatNumberShort(avgReach)}</div>
                <div class="kpi-label">Avg Reach / Post</div>
                <div class="kpi-detail">
                    <span>${formatNumberShort(totalReach)} total reach</span>
                    <span>across ${totalPosts} posts</span>
                </div>
            </div>
            <div class="analytics-kpi-card">
                <div class="kpi-header"><div class="kpi-icon views"><i class="fas fa-eye"></i></div></div>
                <div class="kpi-value">${formatNumberShort(avgViews)}</div>
                <div class="kpi-label">Avg Views / Post</div>
                <div class="kpi-detail">
                    <span>${formatNumberShort(totalViews)} total views</span>
                    <span>${viewEngRatio}% view\u2192engagement</span>
                </div>
            </div>
            <div class="analytics-kpi-card">
                <div class="kpi-header"><div class="kpi-icon saves"><i class="fas fa-bookmark"></i></div></div>
                <div class="kpi-value">${saveRate}%</div>
                <div class="kpi-label">Save Rate</div>
                <div class="kpi-detail">
                    <span>${formatNumber(s.total_saved||0)} saves total</span>
                    <span>High saves = valuable content</span>
                </div>
            </div>
            <div class="analytics-kpi-card">
                <div class="kpi-header"><div class="kpi-icon format"><i class="fas fa-photo-video"></i></div></div>
                <div class="kpi-value">${bf ? capitalize(bf.format) : 'N/A'}</div>
                <div class="kpi-label">Best Performing Format</div>
                <div class="kpi-detail">
                    <span>${bf ? bf.engagement_rate+'% engagement' : 'No data'}</span>
                    <span>${bf ? bf.post_count+' posts' : ''}</span>
                </div>
            </div>
            <div class="analytics-kpi-card">
                <div class="kpi-header"><div class="kpi-icon posts"><i class="fas fa-images"></i></div></div>
                <div class="kpi-value">${totalPosts}</div>
                <div class="kpi-label">Total Posts Tracked</div>
                <div class="kpi-detail">
                    <span>${formatNumber(totalInteractions)} total interactions</span>
                    <span>${totalPosts ? Math.round((s.total_likes||0)/totalPosts) : 0} avg likes/post</span>
                </div>
            </div>`;
    },

    renderEngagementBreakdown(e) {
        const container = $('engagementBreakdown');
        if (!container) return;

        const metrics = [
            { label:'Likes', value:e.likes, icon:'fa-heart', color:'#ef4444', pct:e.likes_pct },
            { label:'Comments', value:e.comments, icon:'fa-comment', color:'#06b6d4', pct:e.comments_pct },
            { label:'Shares', value:e.shares, icon:'fa-share', color:'#22c55e', pct:e.shares_pct },
            { label:'Saves', value:e.saved, icon:'fa-bookmark', color:'#f59e0b', pct:e.saved_pct },
        ];

        container.innerHTML = `
            <div class="engagement-chart-area">
                <div class="donut-chart">${this._renderDonutChart(metrics)}</div>
                <div class="engagement-total-center">
                    <span class="engagement-total-number">${formatNumberShort(e.total)}</span>
                    <span class="engagement-total-label">Total</span>
                </div>
            </div>
            <div class="engagement-legend">
                ${metrics.map(m => `
                    <div class="legend-item">
                        <div class="legend-color" style="background:${m.color}"></div>
                        <div class="legend-info">
                            <div class="legend-label"><i class="fas ${m.icon}"></i> ${m.label}</div>
                            <div class="legend-value">${formatNumber(m.value)} <span class="legend-pct">(${m.pct}%)</span></div>
                        </div>
                        <div class="legend-bar"><div class="legend-bar-fill" style="width:${m.pct}%;background:${m.color}"></div></div>
                    </div>`).join('')}
            </div>`;
    },

    _renderDonutChart(metrics) {
        const total = metrics.reduce((s,m)=>s+m.value,0);
        if (!total) return `<svg viewBox="0 0 200 200" class="donut-svg"><circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" stroke-width="30"/></svg>`;
        let cum=0; const r=80, C=2*Math.PI*r;
        const segs = metrics.map(m => {
            const p=m.value/total*100, da=`${p/100*C} ${C}`, off=-cum/100*C;
            cum+=p;
            return `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${m.color}" stroke-width="30" stroke-dasharray="${da}" stroke-dashoffset="${off}" transform="rotate(-90 100 100)" class="donut-segment"/>`;
        });
        return `<svg viewBox="0 0 200 200" class="donut-svg">${segs.join('')}</svg>`;
    },

    renderContentFormatPerformance(formats) {
        const container = $('contentFormatPerformance');
        if (!container) return;
        if (!formats || !formats.length) {
            container.innerHTML = '<div class="analytics-empty-state"><i class="fas fa-photo-video"></i><p>No format data available yet</p></div>';
            return;
        }
        const maxEng = Math.max(...formats.map(f=>f.avg_engagement_rate),1);
        const icons = {image:'fa-image',single:'fa-image',video:'fa-video',reel:'fa-film',carousel:'fa-images',story:'fa-mobile-alt'};
        const colors = {image:'#6366f1',single:'#6366f1',video:'#ef4444',reel:'#f59e0b',carousel:'#22c55e',story:'#06b6d4'};

        container.innerHTML = `<div class="format-cards-grid">${formats.map((f,i)=>{
            const fmt = f.format||'image';
            const col = colors[fmt]||'#6366f1';
            return `
            <div class="format-performance-card ${i===0?'best-format':''}">
                ${i===0?'<div class="best-badge"><i class="fas fa-crown"></i> Top Performer</div>':''}
                <div class="format-header">
                    <div class="format-icon" style="background:${col}20;color:${col}"><i class="fas ${icons[fmt]||'fa-image'}"></i></div>
                    <div class="format-name">${capitalize(fmt)}</div>
                    <div class="format-count">${f.post_count} post${f.post_count!==1?'s':''}</div>
                </div>
                <div class="format-stats">
                    <div class="format-stat"><span class="format-stat-value">${f.avg_engagement_rate}%</span><span class="format-stat-label">Avg Engagement</span></div>
                    <div class="format-stat"><span class="format-stat-value">${formatNumberShort(f.avg_reach)}</span><span class="format-stat-label">Avg Reach</span></div>
                    <div class="format-stat"><span class="format-stat-value">${formatNumberShort(f.avg_views)}</span><span class="format-stat-label">Avg Views</span></div>
                </div>
                <div class="format-engagement-bar"><div class="format-bar-track"><div class="format-bar-fill" style="width:${(f.avg_engagement_rate/maxEng)*100}%;background:${col}"></div></div></div>
                <div class="format-metrics-row">
                    <span title="Avg Likes"><i class="fas fa-heart"></i> ${f.avg_likes}</span>
                    <span title="Avg Comments"><i class="fas fa-comment"></i> ${f.avg_comments}</span>
                    <span title="Avg Shares"><i class="fas fa-share"></i> ${f.avg_shares}</span>
                    <span title="Avg Saves"><i class="fas fa-bookmark"></i> ${f.avg_saved}</span>
                </div>
            </div>`;
        }).join('')}</div>`;
    },

    renderPostingInsights(p) {
        const container = $('postingInsights');
        if (!container) return;
        const dow = p.day_of_week || {};
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const dayCounts = dayNames.map(d=>dow[d]||0);
        const maxDC = Math.max(...dayCounts,1);
        const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
        const ppw = p.posts_per_week||0;
        const topTopics = p.top_topics||[];

        container.innerHTML = `<div class="posting-insights-grid">
            <div class="insight-card">
                <h4><i class="fas fa-calendar-week"></i> Best Posting Days</h4>
                <div class="day-heatmap">
                    ${dayNames.map((d,i)=>`
                    <div class="day-bar-container ${i===bestDayIdx?'best-day':''}">
                        <div class="day-bar-wrapper"><div class="day-bar" style="height:${(dayCounts[i]/maxDC)*100}%"></div></div>
                        <span class="day-label">${d}</span>
                        <span class="day-count">${dayCounts[i]}</span>
                    </div>`).join('')}
                </div>
                <div class="insight-highlight"><i class="fas fa-star"></i> <strong>${dayNames[bestDayIdx]}</strong> is the most active posting day (${dayCounts[bestDayIdx]} posts)</div>
            </div>
            <div class="insight-card">
                <h4><i class="fas fa-tachometer-alt"></i> Posting Frequency</h4>
                <div class="frequency-display">
                    <div class="frequency-main"><span class="frequency-number">${ppw}</span><span class="frequency-unit">posts/week</span></div>
                    <div class="frequency-detail">
                        <div class="freq-stat"><span class="freq-stat-value">${p.total_posted||0}</span><span class="freq-stat-label">Total Published</span></div>
                        <div class="freq-stat"><span class="freq-stat-value">${p.weeks_active||0}</span><span class="freq-stat-label">Weeks Active</span></div>
                    </div>
                </div>
                <div class="frequency-recommendation">
                    ${ppw>=5?'<i class="fas fa-check-circle text-success"></i> Great posting frequency! Consistency drives growth.'
                     :ppw>=3?'<i class="fas fa-info-circle text-info"></i> Good cadence. Consider increasing to 5-7 posts/week.'
                     :'<i class="fas fa-exclamation-triangle text-warning"></i> Low frequency. Aim for at least 3-5 posts/week.'}
                </div>
            </div>
            <div class="insight-card">
                <h4><i class="fas fa-tags"></i> Top Content Themes</h4>
                ${topTopics.length?`<div class="themes-list">${topTopics.map((t,i)=>`
                    <div class="theme-item">
                        <span class="theme-rank">#${i+1}</span>
                        <span class="theme-name">${truncate(t.topic,30)}</span>
                        <span class="theme-count">${t.cnt} post${t.cnt!==1?'s':''}</span>
                    </div>`).join('')}</div>`
                :'<div class="analytics-empty-state"><p>No topic data available</p></div>'}
            </div>
        </div>`;
    },

    renderTopPerformingPosts(posts) {
        const container = $('topPerformingPosts');
        if (!container) return;
        if (!posts||!posts.length) {
            container.innerHTML = '<div class="analytics-empty-state"><i class="fas fa-trophy"></i><p>No post data available yet</p></div>';
            return;
        }
        container.innerHTML = `<div class="top-posts-list">${posts.map((p,i)=>`
            <div class="top-post-item">
                <div class="top-post-rank ${i<3?'medal-'+(i+1):''}">
                    ${i===0?'<i class="fas fa-trophy"></i>':i===1?'<i class="fas fa-medal"></i>':i===2?'<i class="fas fa-award"></i>':'#'+(i+1)}
                </div>
                <div class="top-post-info">
                    <div class="top-post-topic">${truncate(p.topic||'Untitled',40)}</div>
                    <div class="top-post-meta">
                        <span><i class="fas fa-eye"></i> ${formatNumberShort(p.views||0)}</span>
                        <span><i class="fas fa-users"></i> ${formatNumberShort(p.reach||0)}</span>
                    </div>
                </div>
                <div class="top-post-engagement">
                    <div class="top-post-score">${p.engagement_score||0}%</div>
                    <div class="top-post-actions">
                        <span><i class="fas fa-heart"></i> ${p.likes||0}</span>
                        <span><i class="fas fa-comment"></i> ${p.comments||0}</span>
                        <span><i class="fas fa-share"></i> ${p.shares||0}</span>
                        <span><i class="fas fa-bookmark"></i> ${p.saved||0}</span>
                    </div>
                </div>
            </div>`).join('')}</div>`;
    },

    renderAudienceInsights(a) {
        const container = $('audienceInsights');
        if (!container) return;
        const total = a.total_entries||1;
        const _list = (items)=> {
            if (!items||!items.length) return '<div class="analytics-empty-state"><p>No data available</p></div>';
            const mx = Math.max(...items.map(i=>i.cnt),1);
            return `<div class="distribution-list">${items.map(i=>{
                const pct = total>0?((i.cnt/total)*100).toFixed(0):0;
                return `<div class="distribution-item">
                    <div class="dist-info"><span class="dist-label">${truncate(i.label,25)}</span><span class="dist-value">${i.cnt} <small>(${pct}%)</small></span></div>
                    <div class="dist-bar"><div class="dist-bar-fill" style="width:${(i.cnt/mx)*100}%"></div></div>
                </div>`;}).join('')}</div>`;
        };
        container.innerHTML = `<div class="audience-insights-grid">
            <div class="audience-card"><h4><i class="fas fa-users"></i> Target Audiences</h4>${_list(a.audiences)}</div>
            <div class="audience-card"><h4><i class="fas fa-globe"></i> Top Nationalities</h4>${_list(a.nationalities)}</div>
            <div class="audience-card"><h4><i class="fas fa-birthday-cake"></i> Age Groups</h4>${_list(a.age_groups)}</div>
            <div class="audience-card"><h4><i class="fas fa-bullhorn"></i> Call-to-Action Usage</h4>${_list(a.ctas)}</div>
        </div>`;
    },

    renderRecommendations(recs) {
        const container = $('analyticsRecommendations');
        if (!container) return;
        if (!recs||!recs.length) {
            container.innerHTML = '<div class="analytics-empty-state"><i class="fas fa-lightbulb"></i><p>Publish content to generate recommendations</p></div>';
            return;
        }
        container.innerHTML = recs.map(r=>`
            <div class="recommendation-card ${r.priority}">
                <div class="rec-icon"><i class="fas ${r.icon}"></i></div>
                <div class="rec-content">
                    <h4>${r.title}</h4>
                    <p>${r.description}</p>
                    ${r.metric?`<div class="rec-metric"><strong>${r.metric}</strong></div>`:''}
                </div>
                <div class="rec-priority ${r.priority}">
                    ${r.priority==='high'?'<i class="fas fa-arrow-up"></i> High':r.priority==='medium'?'<i class="fas fa-minus"></i> Medium':'<i class="fas fa-arrow-down"></i> Low'}
                </div>
            </div>`).join('');
    },

    // ── Best Times to Post ────────────────────────────────────
    async loadBestTimes() {
        const container = $('bestTimesContainer');
        if (!container) return;
        container.innerHTML = '<div class="analytics-empty-state"><i class="fas fa-spinner fa-spin"></i><p>Analyzing...</p></div>';
        try {
            const data = await api.getBestTimes();
            this.renderBestTimes(container, data);
        } catch (e) {
            container.innerHTML = `<div class="analytics-empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed: ${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderBestTimes(container, data) {
        const slots = data.best_times || data.time_slots || data || [];
        if (!slots || !slots.length) {
            container.innerHTML = '<div class="analytics-empty-state"><p>No posting time data available yet</p></div>';
            return;
        }
        const maxEng = Math.max(...slots.map(s => s.avg_engagement_rate || s.engagement_rate || s.count || 0), 1);
        container.innerHTML = `
        <div style="padding:16px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
                ${slots.map((s, i) => {
                    const eng = s.avg_engagement_rate || s.engagement_rate || s.count || 0;
                    const label = s.hour !== undefined ? `${String(s.hour).padStart(2,'0')}:00` : (s.day_of_week || s.label || `Slot ${i+1}`);
                    const pct = (eng / maxEng) * 100;
                    const isTop = i === 0;
                    return `
                    <div style="background:rgba(30,41,59,0.8);border-radius:10px;padding:14px;text-align:center;border:1px solid ${isTop ? 'var(--primary)' : 'rgba(255,255,255,0.06)'};">
                        ${isTop ? '<div style="font-size:0.7rem;color:var(--primary);font-weight:700;margin-bottom:6px;"><i class="fas fa-crown"></i> BEST</div>' : ''}
                        <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);">${label}</div>
                        <div style="font-size:0.85rem;color:var(--primary);margin:4px 0;">${typeof eng === 'number' ? eng.toFixed(1) + '%' : eng} engagement</div>
                        ${s.post_count !== undefined ? `<div style="font-size:0.75rem;color:var(--text-muted);">${s.post_count} posts</div>` : ''}
                        <div style="margin-top:8px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;">
                            <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:3px;"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    },

    // ── Analytics by Tags ─────────────────────────────────────
    async loadTagsAnalytics() {
        const container = $('tagAnalyticsContainer');
        if (!container) return;
        container.innerHTML = '<div class="analytics-empty-state"><i class="fas fa-spinner fa-spin"></i><p>Analyzing...</p></div>';
        try {
            const data = await api.getAnalyticsByTags();
            this.renderTagsAnalytics(container, data);
        } catch (e) {
            container.innerHTML = `<div class="analytics-empty-state"><i class="fas fa-exclamation-triangle"></i><p>Failed: ${escapeHtml(e.message)}</p></div>`;
        }
    },

    renderTagsAnalytics(container, data) {
        const tags = data.tags || data || [];
        if (!tags || !tags.length) {
            container.innerHTML = '<div class="analytics-empty-state"><p>No tag data available. Add tags to your calendar entries first.</p></div>';
            return;
        }
        const maxEng = Math.max(...tags.map(t => t.avg_engagement_rate || 0), 1);
        container.innerHTML = `
        <div style="padding:16px;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tag</th>
                        <th>Posts</th>
                        <th>Avg Engagement</th>
                        <th>Avg Reach</th>
                        <th>Avg Views</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
                    ${tags.map(t => `
                    <tr>
                        <td><span style="background:rgba(99,102,241,0.15);color:var(--primary);padding:3px 10px;border-radius:20px;font-size:0.85rem;">${escapeHtml(t.tag)}</span></td>
                        <td>${t.post_count || 0}</td>
                        <td>${(t.avg_engagement_rate || 0).toFixed(2)}%</td>
                        <td>${formatNumberShort(t.avg_reach || 0)}</td>
                        <td>${formatNumberShort(t.avg_views || 0)}</td>
                        <td>
                            <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:8px;width:100px;">
                                <div style="background:var(--primary);height:100%;width:${((t.avg_engagement_rate||0)/maxEng)*100}%;border-radius:4px;"></div>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    },

    // ── Compare Posts ─────────────────────────────────────────
    async runCompareFromModal() {
        const input = $('compareMediaIds');
        if (!input || !input.value.trim()) {
            showToast('Please enter media IDs', 'warning');
            return;
        }
        const ids = input.value.split(',').map(s => s.trim()).filter(Boolean);
        if (ids.length < 2) {
            showToast('Enter at least 2 media IDs to compare', 'warning');
            return;
        }
        const result = $('compareResult');
        if (result) result.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Comparing...</div>';
        try {
            const data = await api.comparePosts(ids);
            if (result) result.innerHTML = this._renderCompareTable(data);
            // Also update the main container
            const main = $('comparePostsContainer');
            if (main) main.innerHTML = this._renderCompareTable(data);
            closeModal('compareModal');
        } catch (e) {
            if (result) result.innerHTML = `<div class="text-danger"><i class="fas fa-times-circle"></i> ${escapeHtml(e.message)}</div>`;
        }
    },

    _renderCompareTable(data) {
        const posts = data.posts || data || [];
        if (!posts.length) return '<div class="analytics-empty-state"><p>No comparison data</p></div>';
        const metrics = ['views', 'reach', 'likes', 'comments', 'shares', 'saved', 'engagement_rate'];
        return `
        <div style="overflow-x:auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        ${posts.map(p => `<th>${truncate(p.topic || p.media_id || 'Post', 20)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${metrics.map(m => {
                        const vals = posts.map(p => parseFloat(p[m]) || 0);
                        const maxVal = Math.max(...vals, 0.001);
                        return `<tr>
                            <td style="font-weight:600;text-transform:capitalize;">${m.replace(/_/g,' ')}</td>
                            ${vals.map(v => `<td style="color:${v === maxVal ? 'var(--success)' : 'var(--text-primary)'};font-weight:${v === maxVal ? '700' : '400'};">${typeof v === 'number' && m === 'engagement_rate' ? v.toFixed(2)+'%' : formatNumber(v)}</td>`).join('')}
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    },

    // ── Compare Periods ───────────────────────────────────────
    async comparePeriods() {
        const p1s = $('period1Start') ? $('period1Start').value : '';
        const p1e = $('period1End')   ? $('period1End').value   : '';
        const p2s = $('period2Start') ? $('period2Start').value : '';
        const p2e = $('period2End')   ? $('period2End').value   : '';

        if (!p1s || !p1e || !p2s || !p2e) {
            showToast('Please fill in all four date fields', 'warning');
            return;
        }

        const result = $('periodsCompareResult');
        if (result) result.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Comparing periods...</div>';
        try {
            const data = await api.comparePeriods(p1s, p1e, p2s, p2e);
            if (result) result.innerHTML = this._renderPeriodsResult(data, p1s, p1e, p2s, p2e);
        } catch (e) {
            if (result) result.innerHTML = `<div class="text-danger"><i class="fas fa-times-circle"></i> ${escapeHtml(e.message)}</div>`;
        }
    },

    _renderPeriodsResult(data, p1s, p1e, p2s, p2e) {
        const p1 = data.period1 || data.period_1 || {};
        const p2 = data.period2 || data.period_2 || {};
        const metrics = ['total_posts', 'total_reach', 'total_views', 'total_likes', 'total_comments', 'avg_engagement_rate'];
        return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Period 1 (${p1s} → ${p1e})</th>
                    <th>Period 2 (${p2s} → ${p2e})</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
                ${metrics.map(m => {
                    const v1 = parseFloat(p1[m]) || 0;
                    const v2 = parseFloat(p2[m]) || 0;
                    const diff = v1 > 0 ? (((v2 - v1) / v1) * 100).toFixed(1) : '—';
                    const up = v2 >= v1;
                    const fmt = (v, key) => key === 'avg_engagement_rate' ? v.toFixed(2)+'%' : formatNumber(v);
                    return `<tr>
                        <td style="font-weight:600;text-transform:capitalize;">${m.replace(/_/g,' ')}</td>
                        <td>${fmt(v1, m)}</td>
                        <td>${fmt(v2, m)}</td>
                        <td style="color:${up ? 'var(--success)' : 'var(--danger)'};">
                            <i class="fas fa-arrow-${up ? 'up' : 'down'}"></i> ${diff !== '—' ? diff+'%' : diff}
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    },

    exportReport() {
        if (!this.data) { showToast('No data to export', 'warning'); return; }
        const s = this.data.summary;
        const f = this.data.formats||[];
        const recs = this.data.recommendations||[];

        const lines = [
            '\u2550'.repeat(55),
            '         INSTAGRAM ANALYTICS REPORT',
            '         Generated: ' + new Date().toLocaleString(),
            '\u2550'.repeat(55), '',
            '\u2500\u2500 KEY PERFORMANCE INDICATORS \u2500\u2500',
            `Engagement Rate:     ${s.engagement_rate}%`,
            `Save Rate:           ${s.save_rate}%`,
            `Total Posts Tracked: ${s.total_posts}`,
            `Total Views:         ${formatNumber(s.total_views)}`,
            `Total Reach:         ${formatNumber(s.total_reach)}`,
            `Total Likes:         ${formatNumber(s.total_likes)}`,
            `Total Comments:      ${formatNumber(s.total_comments)}`,
            `Total Shares:        ${formatNumber(s.total_shares)}`,
            `Total Saves:         ${formatNumber(s.total_saved)}`, '',
            '\u2500\u2500 CONTENT FORMAT PERFORMANCE \u2500\u2500',
            ...f.map(x=>`${(x.format||'').padEnd(12)} | ${x.post_count} posts | Eng: ${x.avg_engagement_rate}% | Avg Reach: ${x.avg_reach}`),
            '',
            '\u2500\u2500 STRATEGIC RECOMMENDATIONS \u2500\u2500',
            ...recs.map((r,i)=>`${i+1}. [${r.priority.toUpperCase()}] ${r.title}\n   ${r.description}${r.metric?'\n   Metric: '+r.metric:''}`),
            '', '\u2550'.repeat(55),
        ];

        const blob = new Blob([lines.join('\n')], {type:'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `instagram-analytics-report-${formatDate(new Date())}.txt`;
        a.click(); URL.revokeObjectURL(url);
        showToast('Report downloaded successfully', 'success');
    },
};
