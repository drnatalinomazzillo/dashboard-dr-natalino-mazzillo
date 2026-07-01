import html2pdf from 'html2pdf.js';
import { formatCurrency } from '../utils/formatters';

/**
 * Exporta relatório AI como PDF
 */
export function exportAIReport(metrics, aiHTML, showToast) {
    const m = metrics || {};
    const period = m.period || 'Período selecionado';
    const fmt = (v) => formatCurrency(v || 0);

    // Criar Overlay de Pré-visualização
    const overlay = document.createElement('div');
    overlay.id = 'pdfPreviewOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.95);z-index:999999;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:40px 0;backdrop-filter:blur(5px);';

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:16px;margin-bottom:20px;position:sticky;top:0;z-index:1000000;background:rgba(0,0,0,0.8);padding:10px 20px;border-radius:12px;border:1px solid #333;backdrop-filter:blur(10px);';

    controls.innerHTML = `
        <button id="btnDownloadActualPdf" style="background:#2563eb;color:white;font-weight:bold;padding:10px 24px;border-radius:8px;display:flex;align-items:center;gap:8px;cursor:pointer;border:none;font-size:14px;transition:0.2s;box-shadow:0 4px 12px rgba(37,99,235,0.4);"><i class="ph-bold ph-download-simple"></i> Baixar PDF</button>
        <button id="btnClosePdfPreview" style="background:#4b5563;color:white;font-weight:bold;padding:10px 24px;border-radius:8px;display:flex;align-items:center;gap:8px;cursor:pointer;border:none;font-size:14px;transition:0.2s;"><i class="ph-bold ph-x"></i> Fechar Pré-visualização</button>
    `;

    const report = document.createElement('div');
    report.id = 'pdfReportTemp';
    report.style.cssText = 'background:#0d0d1a;padding:40px;font-family:Inter,sans-serif;color:#e0e0e0;width:900px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);border-radius:8px;transform-origin:top center;flex-shrink:0;';

    if (window.innerWidth < 950) {
        report.style.transform = `scale(${window.innerWidth / 950})`;
        report.style.marginBottom = `-${(900 * (1 - window.innerWidth / 950))}px`;
    }

    report.innerHTML = `
    <div style="text-align:center;margin-bottom:28px;padding-bottom:18px;border-bottom:3px solid #3b82f6;">
        <div style="font-size:26px;font-weight:800;color:white;margin-bottom:4px;">Análise Growth</div>
        <div style="font-size:15px;color:#3b82f6;font-weight:600;margin-bottom:8px;">Próximo Nível Business®</div>
        <div style="font-size:11px;color:#64748b;">Período: ${period} · Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>

    <div style="font-size:13px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;border-bottom:2px solid #1e3a5f;padding-bottom:6px;">📊 Métricas do Período</div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px;">
        <tr style="background:rgba(59,130,246,0.08);">
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Faturamento Total</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#34d399;font-size:14px;">${fmt(m.faturamentoTotal)}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Investimento Total</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:#f97316;">${fmt(m.investimentoTotal)}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Vendas Consulta</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;font-weight:600;">${m.consultasVendidas || 0}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Vendas Procedimento</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;font-weight:600;">${m.procedimentosVendidos || 0}</td>
        </tr>
        <tr style="background:rgba(59,130,246,0.08);">
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Total de Leads</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${m.totalLeads || 0}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">CPL Médio Geral</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${fmt(m.cplMedio)}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Campanhas Vendas</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${fmt(m.vendasInvestReal)} (${m.vendasLeadsCount || 0} Leads)</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">CPL Vendas</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:#34d399;font-weight:600;">${fmt(m.vendasCpl)}</td>
        </tr>
        <tr style="background:rgba(59,130,246,0.08);">
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Campanhas Engajamento</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${fmt(m.engajamentoInvestReal)} (${m.engajamentoLeadsCount || 0} Leads)</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">CPL Engajamento</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:#a78bfa;font-weight:600;">${fmt(m.engajamentoCpl)}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Leads por Público</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">Mulheres: ${m.leadsMulher || 0} | Homens: ${m.leadsHomem || 0}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Leads por Unidade</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">RJ: ${m.leadsRJ || 0} | CF: ${m.leadsCF || 0}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">ROAS Consulta</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:#a78bfa;font-weight:600;">${m.roasConsulta || '--'}x</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">ROAS Procedimento</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:#34d399;font-weight:600;">${m.roasProcedimento || '--'}x</td>
        </tr>
        <tr style="background:rgba(59,130,246,0.08);">
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">CPA Consulta</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${fmt(m.cpaConsulta)}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">CPA Procedimento</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${fmt(m.cpaProcedimento)}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Ticket Médio (Proc)</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${fmt(m.ticketMedioProcedimento)}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Leads p/ Consulta</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${m.leadsPorConsulta || '--'}</td>
        </tr>
        <tr style="background:rgba(59,130,246,0.08);">
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Consultas Realizadas p/ Proc</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${m.consultasPorProcedimento || '--'}</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;font-weight:700;color:#94a3b8;">Ticket Médio (Faturamento)</td>
            <td style="padding:10px 14px;border:1px solid #1e293b;color:white;">${m.faturamentoTotal && m.consultasVendidas ? fmt(m.faturamentoTotal / (m.consultasVendidas + m.procedimentosVendidos)) : '--'}</td>
        </tr>
    </table>

    <div style="font-size:13px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;border-bottom:2px solid #1e3a5f;padding-bottom:6px;">🤖 Análise Estratégica (IA)</div>
    <div style="background:#111827;border:1px solid #1e3a5f;border-radius:12px;padding:20px 24px;font-size:13px;line-height:1.85;color:#cbd5e1;">${aiHTML}</div>

    <div style="margin-top:32px;padding-top:14px;border-top:1px solid #1e293b;text-align:center;">
        <div style="font-size:9px;color:#475569;">Relatório gerado pelo Dashboard Próximo Nível Business® · Dados do período selecionado</div>
    </div>
    `;

    overlay.appendChild(controls);
    overlay.appendChild(report);
    document.body.appendChild(overlay);

    document.getElementById('btnClosePdfPreview').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    document.getElementById('btnDownloadActualPdf').addEventListener('click', (e) => {
        const downloadBtn = e.currentTarget;
        const origHtml = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Gerando...';
        downloadBtn.disabled = true;

        const opt = {
            margin: [6, 6, 6, 6],
            filename: `Analise_Growth_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0d0d1a', scrollY: 0, windowWidth: 900 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const oldTransform = report.style.transform;
        report.style.transform = 'none';

        html2pdf().set(opt).from(report).save().then(() => {
            downloadBtn.innerHTML = origHtml;
            downloadBtn.disabled = false;
            report.style.transform = oldTransform;
            if (showToast) showToast('PDF gerado com sucesso!');
        }).catch(err => {
            console.error('PDF Error:', err);
            downloadBtn.innerHTML = origHtml;
            downloadBtn.disabled = false;
            report.style.transform = oldTransform;
            if (showToast) showToast('Erro ao gerar PDF', 'error');
        });
    });
}
