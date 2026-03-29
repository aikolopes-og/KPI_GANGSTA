"""
KPI GANGSTAS — Teste End-to-End
Cria cópia da planilha original, executa INSERT, DELETE e SELECT,
re-processa os KPIs e valida o pipeline completo (backend → JSON → API → frontend).

Uso: python tests/e2e_test.py
"""

import os
import sys
import shutil
import json
import time
import urllib.request
import urllib.error

import pandas as pd
import openpyxl

# ── Caminhos ──────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAL = os.path.join(ROOT, "Funil_Vendas.xlsx")
COPY = os.path.join(ROOT, "Funil_Vendas_TEST.xlsx")
BACKUP_ORIGINAL = os.path.join(ROOT, "Funil_Vendas_BACKUP.xlsx")
JSON_PATH = os.path.join(ROOT, "frontend", "data", "kpis.json")

PASS = 0
FAIL = 0


def log(msg):
    print(f"  {msg}")


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  (OK) {name}")
    else:
        FAIL += 1
        print(f"  (ERROR) {name}  {detail}")


# ══════════════════════════════════════════════════════════════
# FASE 1 — SELECT: ler dados originais
# ══════════════════════════════════════════════════════════════
def fase_select_original():
    section("FASE 1 — SELECT na planilha original")
    df = pd.read_excel(ORIGINAL)
    n_rows = len(df)
    n_cols = len(df.columns)
    log(f"Registros: {n_rows} | Colunas: {n_cols}")

    check("Planilha carregada", n_rows > 0)
    check("Possui 14 colunas", n_cols == 14, f"(encontradas {n_cols})")
    check("Coluna 'Canal' existe", "Canal" in df.columns)
    check("Coluna 'Status' existe", "Status" in df.columns)
    check("Coluna 'Valor_Potencial' existe", "Valor_Potencial" in df.columns)
    check("Coluna 'Leads' existe", "Leads" in df.columns)

    # SELECT filtrado
    ganhos = df[df["Status"] == "Ganho"]
    log(f"SELECT Status='Ganho': {len(ganhos)} registros")
    check("SELECT filtrado funciona", len(ganhos) > 0)

    canais = df["Canal"].unique().tolist()
    log(f"Canais únicos: {canais}")
    check("Possui canais diversos", len(canais) >= 3)

    return df, n_rows


# ══════════════════════════════════════════════════════════════
# FASE 2 — Copiar planilha e fazer INSERT + DELETE + SELECT
# ══════════════════════════════════════════════════════════════
def fase_crud_na_copia(original_count):
    section("FASE 2 — COPY + INSERT + DELETE + SELECT na cópia")

    # COPY
    shutil.copy2(ORIGINAL, COPY)
    check("Cópia criada (Funil_Vendas_TEST.xlsx)", os.path.exists(COPY))

    df = pd.read_excel(COPY)
    check("Cópia lida corretamente", len(df) == original_count)

    # ── INSERT: adicionar 3 registros novos ──
    log("INSERT: adicionando 3 registros de teste...")
    novos = pd.DataFrame([
        {
            "ID": original_count + 1, "Etapa": "Proposta", "Canal": "LinkedIn",
            "Leads": 15, "Conversao_Percentual": 42.5, "Tempo_dias": 18,
            "Valor_Potencial": 28000, "Responsavel": "Teste_E2E",
            "Data_Prospecção": pd.Timestamp("2025-01-15"),
            "Data_Contato": pd.Timestamp("2025-01-20"),
            "Data_Proposta": pd.Timestamp("2025-02-01"),
            "Data_Fechamento": pd.Timestamp("2025-02-10"),
            "Status": "Ganho", "Origem_Lead": "Orgânico"
        },
        {
            "ID": original_count + 2, "Etapa": "Contato", "Canal": "Instagram",
            "Leads": 8, "Conversao_Percentual": 25.0, "Tempo_dias": 30,
            "Valor_Potencial": 15000, "Responsavel": "Teste_E2E",
            "Data_Prospecção": pd.Timestamp("2025-02-01"),
            "Data_Contato": pd.Timestamp("2025-02-10"),
            "Data_Proposta": pd.Timestamp("2025-02-25"),
            "Data_Fechamento": pd.Timestamp("2025-03-01"),
            "Status": "Em negociação", "Origem_Lead": "Pago"
        },
        {
            "ID": original_count + 3, "Etapa": "Fechamento", "Canal": "WhatsApp",
            "Leads": 20, "Conversao_Percentual": 60.0, "Tempo_dias": 12,
            "Valor_Potencial": 50000, "Responsavel": "Teste_E2E",
            "Data_Prospecção": pd.Timestamp("2025-03-01"),
            "Data_Contato": pd.Timestamp("2025-03-05"),
            "Data_Proposta": pd.Timestamp("2025-03-08"),
            "Data_Fechamento": pd.Timestamp("2025-03-12"),
            "Status": "Ganho", "Origem_Lead": "Indicação"
        },
    ])
    df = pd.concat([df, novos], ignore_index=True)
    check("INSERT: 3 registros adicionados", len(df) == original_count + 3)

    # SELECT pós-insert
    teste_rows = df[df["Responsavel"] == "Teste_E2E"]
    check("SELECT pós-INSERT: encontrou 3 registros de teste", len(teste_rows) == 3)

    linkedin = df[df["Canal"] == "LinkedIn"]
    check("SELECT: novo canal 'LinkedIn' existe", len(linkedin) >= 1)

    # ── DELETE: remover registros com Valor_Potencial < 5000 ──
    log("DELETE: removendo registros com Valor_Potencial < 5000...")
    antes_del = len(df)
    deletados = df[df["Valor_Potencial"] < 5000]
    n_deletados = len(deletados)
    df = df[df["Valor_Potencial"] >= 5000].reset_index(drop=True)
    log(f"  Removidos {n_deletados} registros (Valor_Potencial < 5000)")
    check("DELETE executado", len(df) == antes_del - n_deletados)
    check("DELETE: nenhum registro com valor < 5000 restante",
          len(df[df["Valor_Potencial"] < 5000]) == 0)

    # ── SELECT final ──
    log("SELECT final na planilha modificada:")
    log(f"  Total registros: {len(df)}")
    log(f"  Soma Valor_Potencial: R${df['Valor_Potencial'].sum():,.0f}")
    log(f"  Status únicos: {df['Status'].unique().tolist()}")
    log(f"  Canais únicos: {df['Canal'].unique().tolist()}")

    # Gravar cópia modificada
    df.to_excel(COPY, index=False)
    check("Cópia modificada salva", os.path.exists(COPY))

    return df


# ══════════════════════════════════════════════════════════════
# FASE 3 — Gerar KPIs a partir da cópia modificada
# ══════════════════════════════════════════════════════════════
def fase_gerar_kpis(df_modificado):
    section("FASE 3 — Re-gerar KPIs com dados modificados")

    # Fazer backup do original e colocar a cópia no lugar
    shutil.copy2(ORIGINAL, BACKUP_ORIGINAL)
    shutil.copy2(COPY, ORIGINAL)
    log("Planilha original backed-up, cópia de teste no lugar")

    # Rodar gerar_kpis.py
    sys.path.insert(0, os.path.join(ROOT, "backend"))
    import importlib
    gerar_kpis = importlib.import_module("gerar_kpis")
    importlib.reload(gerar_kpis)

    try:
        gerar_kpis.main()
        check("gerar_kpis.py executou sem erros", True)
    except Exception as e:
        check("gerar_kpis.py executou sem erros", False, str(e))
        # Restaurar original
        shutil.copy2(BACKUP_ORIGINAL, ORIGINAL)
        return None

    # Validar JSON gerado
    check("kpis.json existe", os.path.exists(JSON_PATH))

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    check("JSON possui 'resumo'", "resumo" in data)
    check("JSON possui 'kpi_1'", "kpi_1" in data)
    check("JSON possui 'kpi_2'", "kpi_2" in data)
    check("JSON possui 'kpi_3'", "kpi_3" in data)
    check("JSON possui '_meta'", "_meta" in data)

    # Validar resumo reflete dados modificados
    resumo = data["resumo"]
    log(f"  total_registros no JSON: {resumo['total_registros']}")
    log(f"  total_registros esperado: {len(df_modificado)}")
    check("Resumo total_registros correto",
          resumo["total_registros"] == len(df_modificado),
          f"esperado={len(df_modificado)}, recebido={resumo['total_registros']}")

    # KPI 1 - dados de canais
    kpi1 = data["kpi_1"]
    check("KPI 1 tem título", bool(kpi1.get("titulo")))
    check("KPI 1 tem matplotlib_img", bool(kpi1.get("matplotlib_img")))
    check("KPI 1 tem plotly_json", bool(kpi1.get("plotly_json")))
    check("KPI 1 tem insight", bool(kpi1.get("insight")))
    canais_kpi = [d["Canal"] for d in kpi1.get("dados", [])]
    check("KPI 1 inclui canal 'LinkedIn' (inserido)",
          "LinkedIn" in canais_kpi,
          f"canais encontrados: {canais_kpi}")

    # KPI 2
    kpi2 = data["kpi_2"]
    check("KPI 2 tem dados", bool(kpi2.get("dados")))
    check("KPI 2 tem plotly_json", bool(kpi2.get("plotly_json")))

    # KPI 3
    kpi3 = data["kpi_3"]
    check("KPI 3 tem dados_canal", bool(kpi3.get("dados_canal")))
    check("KPI 3 tem dados_status", bool(kpi3.get("dados_status")))

    return data


# ══════════════════════════════════════════════════════════════
# FASE 4 — Validar APIs Next.js (se Docker estiver rodando)
# ══════════════════════════════════════════════════════════════
def fase_validar_apis():
    section("FASE 4 — Validar APIs Next.js e Frontend")

    endpoints = [
        ("http://localhost:3000", "Frontend HTML"),
        ("http://localhost:3000/api/kpis", "API /api/kpis"),
        ("http://localhost:3000/api/resumo", "API /api/resumo"),
        ("http://localhost:3000/api/kpi/1", "API /api/kpi/1"),
        ("http://localhost:3000/api/kpi/2", "API /api/kpi/2"),
        ("http://localhost:3000/api/kpi/3", "API /api/kpi/3"),
    ]

    for url, name in endpoints:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "E2E-Test"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                body = resp.read().decode("utf-8", errors="replace")
                check(f"{name} → HTTP {status}", status == 200)

                if url.endswith("/api/kpis"):
                    data = json.loads(body)
                    check("  /api/kpis retorna 'resumo'", "resumo" in data)
                    check("  /api/kpis retorna 'kpi_1'", "kpi_1" in data)
                elif url.endswith("/api/resumo"):
                    data = json.loads(body)
                    check("  /api/resumo tem 'total_registros'", "total_registros" in data)
                elif url.endswith("/api/kpi/1"):
                    data = json.loads(body)
                    check("  /api/kpi/1 tem 'titulo'", "titulo" in data)
                elif url == "http://localhost:3000":
                    check("  Frontend contém 'KPI'", "KPI" in body or "kpi" in body.lower())
        except urllib.error.URLError as e:
            check(f"{name} acessível", False, str(e))
        except Exception as e:
            check(f"{name} respondeu", False, str(e))

    # Backend health
    try:
        req = urllib.request.Request("http://localhost:8000/health",
                                     headers={"User-Agent": "E2E-Test"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            check("Backend /health → HTTP 200", resp.status == 200)
    except Exception:
        log("  (Backend pode não ter /health — não-crítico)")


# ══════════════════════════════════════════════════════════════
# FASE 5 — Restaurar estado original
# ══════════════════════════════════════════════════════════════
def fase_restaurar():
    section("FASE 5 — Restauração (limpeza)")

    # Restaurar planilha original
    if os.path.exists(BACKUP_ORIGINAL):
        shutil.copy2(BACKUP_ORIGINAL, ORIGINAL)
        os.remove(BACKUP_ORIGINAL)
        log("Planilha original restaurada do backup")
        check("Original restaurado", True)
    else:
        log("Sem backup para restaurar (original não foi alterado)")

    # Remover cópia de teste
    if os.path.exists(COPY):
        os.remove(COPY)
        check("Cópia de teste removida", True)

    # Re-gerar JSON com dados originais
    log("Re-gerando kpis.json com dados originais...")
    sys.path.insert(0, os.path.join(ROOT, "backend"))
    import importlib
    gerar_kpis = importlib.import_module("gerar_kpis")
    importlib.reload(gerar_kpis)
    try:
        gerar_kpis.main()
        check("kpis.json re-gerado com dados originais", True)
    except Exception as e:
        check("kpis.json re-gerado", False, str(e))


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
def main():
    print("\n" + "=" * 60)
    print("  KPI GANGSTAS -- TESTE END-TO-END")
    print("=" * 60)

    try:
        # Fase 1: SELECT original
        df_original, n_original = fase_select_original()

        # Fase 2: CRUD na cópia
        df_modificado = fase_crud_na_copia(n_original)

        # Fase 3: Gerar KPIs
        kpi_data = fase_gerar_kpis(df_modificado)

        # Fase 4: Validar APIs (containers devem estar rodando)
        fase_validar_apis()

    finally:
        # Fase 5: SEMPRE restaurar
        fase_restaurar()

    # Relatório
    section("RELATÓRIO FINAL")
    total = PASS + FAIL
    print(f"\n  Total de verificacoes: {total}")
    print(f"  (OK) Passou: {PASS}")
    print(f"  (ERROR) Falhou: {FAIL}")
    print(f"  Taxa de sucesso: {PASS/total*100:.1f}%\n")

    if FAIL == 0:
        print("  TODOS OS TESTES PASSARAM! Sistema validado.\n")
    else:
        print(f"  ATENCAO: {FAIL} teste(s) falharam. Revise os detalhes acima.\n")

    return FAIL == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
