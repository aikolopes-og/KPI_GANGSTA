"""
KPI GANGSTAS - Script de Pré-processamento
Gera o arquivo JSON com todos os KPIs processados via Pandas + Matplotlib.
Esse JSON é consumido pelo Next.js (API Routes) tanto em Docker quanto na Vercel.

Uso: python gerar_kpis.py
Saída: frontend/data/kpis.json
"""

import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import plotly.graph_objects as go
from io import BytesIO
import base64
import json
import os
import sys

# Caminho da planilha
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_PATH = os.path.join(ROOT_DIR, 'Funil_Vendas.xlsx')
OUTPUT_DIR = os.path.join(ROOT_DIR, 'frontend', 'data')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'kpis.json')


def carregar_dados() -> pd.DataFrame:
    print(f"[INFO] Carregando planilha: {DATA_PATH}")
    df = pd.read_excel(DATA_PATH)
    print(f"[INFO] {len(df)} registros carregados, {len(df.columns)} colunas")
    return df


def gerar_grafico_matplotlib(fig) -> str:
    buf = BytesIO()
    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='#1a1a2e')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64


# ============================================================
# KPI 1: Taxa de Conversão por Canal
# ============================================================
def kpi_conversao_por_canal(df: pd.DataFrame):
    dados = df.groupby('Canal').agg(
        media_conversao=('Conversao_Percentual', 'mean'),
        total_leads=('Leads', 'sum'),
        ganhos=('Status', lambda x: (x == 'Ganho').sum()),
        total=('Status', 'count')
    ).reset_index()
    dados['taxa_ganho'] = (dados['ganhos'] / dados['total'] * 100).round(1)

    cores = ['#e94560', '#0f3460', '#16213e', '#533483', '#e94560']
    fig, axes = plt.subplots(1, 2, figsize=(14, 6), facecolor='#1a1a2e')

    ax1 = axes[0]
    ax1.set_facecolor('#16213e')
    barras = ax1.bar(dados['Canal'], dados['media_conversao'], color=cores, edgecolor='white', linewidth=0.5)
    ax1.set_title('Conversão Média por Canal (%)', color='white', fontsize=14, fontweight='bold')
    ax1.set_ylabel('Conversão (%)', color='white')
    ax1.tick_params(colors='white')
    for barra, valor in zip(barras, dados['media_conversao']):
        ax1.text(barra.get_x() + barra.get_width()/2., barra.get_height() + 1,
                f'{valor:.1f}%', ha='center', va='bottom', color='white', fontweight='bold')

    ax2 = axes[1]
    ax2.set_facecolor('#16213e')
    barras2 = ax2.bar(dados['Canal'], dados['taxa_ganho'], color=cores, edgecolor='white', linewidth=0.5)
    ax2.set_title('Taxa de Fechamento por Canal (%)', color='white', fontsize=14, fontweight='bold')
    ax2.set_ylabel('Fechamento (%)', color='white')
    ax2.tick_params(colors='white')
    for barra, valor in zip(barras2, dados['taxa_ganho']):
        ax2.text(barra.get_x() + barra.get_width()/2., barra.get_height() + 1,
                f'{valor:.1f}%', ha='center', va='bottom', color='white', fontweight='bold')

    fig.suptitle('KPI 1 - Taxa de Conversão por Canal', color='#e94560', fontsize=16, fontweight='bold')
    fig.tight_layout()
    img_matplotlib = gerar_grafico_matplotlib(fig)

    fig_plotly = go.Figure()
    fig_plotly.add_trace(go.Bar(
        name='Conversão Média (%)', x=dados['Canal'].tolist(), y=dados['media_conversao'].tolist(),
        marker_color='#e94560', text=[f'{v:.1f}%' for v in dados['media_conversao']], textposition='auto'
    ))
    fig_plotly.add_trace(go.Bar(
        name='Taxa de Fechamento (%)', x=dados['Canal'].tolist(), y=dados['taxa_ganho'].tolist(),
        marker_color='#533483', text=[f'{v:.1f}%' for v in dados['taxa_ganho']], textposition='auto'
    ))
    fig_plotly.update_layout(
        title='KPI 1 - Taxa de Conversão por Canal', barmode='group',
        template='plotly_dark', paper_bgcolor='#1a1a2e', plot_bgcolor='#16213e', font=dict(color='white')
    )

    melhor = dados.loc[dados['taxa_ganho'].idxmax()]
    pior = dados.loc[dados['taxa_ganho'].idxmin()]
    insight = (
        f"O canal '{melhor['Canal']}' apresenta a melhor taxa de fechamento ({melhor['taxa_ganho']}%), "
        f"enquanto '{pior['Canal']}' tem a menor ({pior['taxa_ganho']}%). "
        f"Recomenda-se concentrar esforços no canal mais eficiente."
    )

    return {
        "titulo": "Taxa de Conversão por Canal",
        "descricao": "Analisa a eficiência de cada canal de aquisição em converter leads em vendas fechadas.",
        "dados": dados.to_dict(orient='records'),
        "matplotlib_img": img_matplotlib,
        "plotly_json": json.loads(fig_plotly.to_json()),
        "insight": insight
    }


# ============================================================
# KPI 2: Valor Potencial por Status do Funil
# ============================================================
def kpi_valor_por_status(df: pd.DataFrame):
    dados = df.groupby('Status').agg(
        valor_total=('Valor_Potencial', 'sum'),
        valor_medio=('Valor_Potencial', 'mean'),
        quantidade=('ID', 'count')
    ).reset_index()

    ordem_status = ['Aberto', 'Em negociação', 'Ganho', 'Perdido']
    dados['Status'] = pd.Categorical(dados['Status'], categories=ordem_status, ordered=True)
    dados = dados.sort_values('Status')
    cores_status = {'Aberto': '#0f3460', 'Em negociação': '#533483', 'Ganho': '#2ecc71', 'Perdido': '#e94560'}

    fig, axes = plt.subplots(1, 2, figsize=(14, 6), facecolor='#1a1a2e')

    ax1 = axes[0]
    ax1.set_facecolor('#1a1a2e')
    cores_lista = [cores_status.get(s, '#999') for s in dados['Status']]
    ax1.pie(dados['valor_total'], labels=dados['Status'], autopct='%1.1f%%',
            colors=cores_lista, textprops={'color': 'white', 'fontsize': 10})
    ax1.set_title('Distribuição do Valor por Status', color='white', fontsize=14, fontweight='bold')

    ax2 = axes[1]
    ax2.set_facecolor('#16213e')
    ax2.barh(dados['Status'].astype(str), dados['valor_total'], color=cores_lista, edgecolor='white', linewidth=0.5)
    ax2.set_title('Valor Potencial Total por Status (R$)', color='white', fontsize=14, fontweight='bold')
    ax2.set_xlabel('Valor (R$)', color='white')
    ax2.tick_params(colors='white')
    for i, (val, qtd) in enumerate(zip(dados['valor_total'], dados['quantidade'])):
        ax2.text(val + 500, i, f'R${val:,.0f} ({qtd} leads)', va='center', color='white', fontsize=9)

    fig.suptitle('KPI 2 - Valor Potencial por Status', color='#e94560', fontsize=16, fontweight='bold')
    fig.tight_layout()
    img_matplotlib = gerar_grafico_matplotlib(fig)

    fig_plotly = go.Figure()
    fig_plotly.add_trace(go.Funnel(
        y=dados['Status'].astype(str).tolist(), x=dados['valor_total'].tolist(),
        textinfo="value+percent initial",
        marker=dict(color=[cores_status.get(s, '#999') for s in dados['Status']])
    ))
    fig_plotly.update_layout(
        title='KPI 2 - Funil de Valor Potencial por Status',
        template='plotly_dark', paper_bgcolor='#1a1a2e', plot_bgcolor='#16213e', font=dict(color='white')
    )

    total = dados['valor_total'].sum()
    ganho = dados.loc[dados['Status'] == 'Ganho', 'valor_total']
    perdido = dados.loc[dados['Status'] == 'Perdido', 'valor_total']
    ganho_val = ganho.values[0] if len(ganho) > 0 else 0
    perdido_val = perdido.values[0] if len(perdido) > 0 else 0
    insight = (
        f"Valor total no pipeline: R${total:,.0f}. "
        f"Valor ganho: R${ganho_val:,.0f} ({ganho_val/total*100:.1f}%). "
        f"Valor perdido: R${perdido_val:,.0f} ({perdido_val/total*100:.1f}%). "
        f"{'Boa taxa de aproveitamento!' if ganho_val > perdido_val else 'Atenção: valor perdido supera o ganho.'}"
    )

    return {
        "titulo": "Valor Potencial por Status",
        "descricao": "Mostra como o valor potencial está distribuído entre os diferentes status do funil de vendas.",
        "dados": dados.to_dict(orient='records'),
        "matplotlib_img": img_matplotlib,
        "plotly_json": json.loads(fig_plotly.to_json()),
        "insight": insight
    }


# ============================================================
# KPI 3: Tempo Médio do Ciclo de Vendas
# ============================================================
def kpi_tempo_ciclo(df: pd.DataFrame):
    df = df.copy()
    df['dias_prospeccao_contato'] = (df['Data_Contato'] - df['Data_Prospecção']).dt.days
    df['dias_contato_proposta'] = (df['Data_Proposta'] - df['Data_Contato']).dt.days
    df['dias_proposta_fechamento'] = (df['Data_Fechamento'] - df['Data_Proposta']).dt.days
    df['dias_total'] = (df['Data_Fechamento'] - df['Data_Prospecção']).dt.days

    tempo_canal = df.groupby('Canal').agg(
        media_total=('dias_total', 'mean'),
        media_prospeccao=('dias_prospeccao_contato', 'mean'),
        media_contato=('dias_contato_proposta', 'mean'),
        media_proposta=('dias_proposta_fechamento', 'mean')
    ).reset_index().round(1)

    tempo_status = df.groupby('Status').agg(
        media_total=('dias_total', 'mean'),
    ).reset_index().round(1)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6), facecolor='#1a1a2e')

    ax1 = axes[0]
    ax1.set_facecolor('#16213e')
    x = range(len(tempo_canal))
    largura = 0.6
    ax1.bar(x, tempo_canal['media_prospeccao'], largura, label='Prospecção→Contato', color='#0f3460')
    ax1.bar(x, tempo_canal['media_contato'], largura, bottom=tempo_canal['media_prospeccao'],
            label='Contato→Proposta', color='#533483')
    ax1.bar(x, tempo_canal['media_proposta'], largura,
            bottom=tempo_canal['media_prospeccao'] + tempo_canal['media_contato'],
            label='Proposta→Fechamento', color='#e94560')
    ax1.set_xticks(x)
    ax1.set_xticklabels(tempo_canal['Canal'], color='white')
    ax1.set_title('Tempo Médio do Ciclo por Canal (dias)', color='white', fontsize=14, fontweight='bold')
    ax1.set_ylabel('Dias', color='white')
    ax1.tick_params(colors='white')
    ax1.legend(facecolor='#16213e', edgecolor='white', labelcolor='white', fontsize=8)

    ax2 = axes[1]
    ax2.set_facecolor('#16213e')
    cores_s = ['#0f3460', '#533483', '#2ecc71', '#e94560']
    barras = ax2.bar(tempo_status['Status'], tempo_status['media_total'], color=cores_s, edgecolor='white', linewidth=0.5)
    ax2.set_title('Tempo Médio Total por Status (dias)', color='white', fontsize=14, fontweight='bold')
    ax2.set_ylabel('Dias', color='white')
    ax2.tick_params(colors='white')
    for barra, valor in zip(barras, tempo_status['media_total']):
        ax2.text(barra.get_x() + barra.get_width()/2., barra.get_height() + 0.5,
                f'{valor:.1f}d', ha='center', va='bottom', color='white', fontweight='bold')

    fig.suptitle('KPI 3 - Tempo Médio do Ciclo de Vendas', color='#e94560', fontsize=16, fontweight='bold')
    fig.tight_layout()
    img_matplotlib = gerar_grafico_matplotlib(fig)

    fig_plotly = go.Figure()
    fig_plotly.add_trace(go.Bar(name='Prospecção→Contato', x=tempo_canal['Canal'].tolist(),
                                y=tempo_canal['media_prospeccao'].tolist(), marker_color='#0f3460'))
    fig_plotly.add_trace(go.Bar(name='Contato→Proposta', x=tempo_canal['Canal'].tolist(),
                                y=tempo_canal['media_contato'].tolist(), marker_color='#533483'))
    fig_plotly.add_trace(go.Bar(name='Proposta→Fechamento', x=tempo_canal['Canal'].tolist(),
                                y=tempo_canal['media_proposta'].tolist(), marker_color='#e94560'))
    fig_plotly.update_layout(
        barmode='stack', title='KPI 3 - Tempo do Ciclo por Canal (dias)',
        template='plotly_dark', paper_bgcolor='#1a1a2e', plot_bgcolor='#16213e',
        font=dict(color='white'), yaxis_title='Dias'
    )

    mais_rapido = tempo_canal.loc[tempo_canal['media_total'].idxmin()]
    mais_lento = tempo_canal.loc[tempo_canal['media_total'].idxmax()]
    insight = (
        f"O canal mais rápido é '{mais_rapido['Canal']}' com média de {mais_rapido['media_total']:.1f} dias. "
        f"O mais lento é '{mais_lento['Canal']}' com {mais_lento['media_total']:.1f} dias. "
        f"A otimização da etapa mais demorada pode reduzir significativamente o ciclo de vendas."
    )

    return {
        "titulo": "Tempo Médio do Ciclo de Vendas",
        "descricao": "Mede o tempo médio em dias entre cada etapa do funil, por canal e por status.",
        "dados_canal": tempo_canal.to_dict(orient='records'),
        "dados_status": tempo_status.to_dict(orient='records'),
        "matplotlib_img": img_matplotlib,
        "plotly_json": json.loads(fig_plotly.to_json()),
        "insight": insight
    }


# ============================================================
# Resumo Geral
# ============================================================
def resumo_geral(df: pd.DataFrame):
    total_leads = df['Leads'].sum()
    valor_total = df['Valor_Potencial'].sum()
    status_counts = df['Status'].value_counts().to_dict()
    canais = df['Canal'].value_counts().to_dict()
    return {
        "total_registros": int(len(df)),
        "total_leads": int(total_leads),
        "valor_total_pipeline": float(valor_total),
        "distribuicao_status": status_counts,
        "distribuicao_canais": canais,
        "periodo": {
            "inicio": str(df['Data_Prospecção'].min().date()),
            "fim": str(df['Data_Prospecção'].max().date())
        }
    }


# ============================================================
# Main
# ============================================================
def main():
    print("=" * 60)
    print("  KPI GANGSTAS - Gerador de KPIs")
    print("  Pandas + Matplotlib → JSON para Next.js")
    print("=" * 60)

    df = carregar_dados()

    print("[INFO] Processando KPI 1 - Taxa de Conversão por Canal...")
    kpi1 = kpi_conversao_por_canal(df)

    print("[INFO] Processando KPI 2 - Valor Potencial por Status...")
    kpi2 = kpi_valor_por_status(df)

    print("[INFO] Processando KPI 3 - Tempo Médio do Ciclo...")
    kpi3 = kpi_tempo_ciclo(df)

    print("[INFO] Gerando resumo geral...")
    resumo = resumo_geral(df)

    resultado = {
        "resumo": resumo,
        "kpi_1": kpi1,
        "kpi_2": kpi2,
        "kpi_3": kpi3,
        "_meta": {
            "gerado_por": "gerar_kpis.py (Pandas + Matplotlib)",
            "planilha": "Funil_Vendas.xlsx",
            "total_registros": len(df)
        }
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False)

    tamanho_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"\n[OK] Arquivo gerado: {OUTPUT_PATH}")
    print(f"[OK] Tamanho: {tamanho_mb:.2f} MB")
    print(f"[OK] KPIs prontos para consumo pelo Next.js!")


if __name__ == '__main__':
    main()
