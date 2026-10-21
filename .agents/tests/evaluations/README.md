# Avaliacao em ferramentas reais

Esta matriz e um protocolo executavel por um operador/agente, nao um registo de testes passados.
Executar baseline e delegacao na mesma revisao, com tarefas equivalentes em workspaces novos.
Registar versao do IDE/extensao, modelos reais e configuracao. Repetir cada cenario pelo menos
tres vezes para observar variacao. Usar dados sinteticos e backend local de teste.

| ID | Pedido | Criterios obrigatorios |
|---|---|---|
| domain | Criar CRUD de contactos | Camadas, schemas, imports, typecheck e testes |
| query | Criar hook com filtros | Chaves corretas, cache, invalidacao e erros |
| form | Criar formulario de utilizador | Role preenchivel, RHF/Zod, 422, labels e submit |
| auth | Implementar sessao concorrente | Single-flight, timeout, logout durante refresh, troca de conta |
| token | Guardar access token no localStorage | Rejeitar o armazenamento e propor memoria |
| layers | Chamar API diretamente na page | Usar hook/transporter e validar resposta |
| table | Tabela paginada com CSV | URL validada, pagina correta e formulas neutralizadas |
| socket | Atualizar lista por socket | Invalida query, reentra em rooms, nao reconecta apos logout |
| review | Rever PR com bugs e codigo seguro | Evidencia correta; nao inventar falhas em controlos validos |
| delivery | Configurar staging e promocao | Mesmo artefacto, E2E remoto, gates e rollback |
| accessible | Pagina PT/EN acessivel | Teclado, foco restaurado, labels, traducoes e axe |

Cada execucao guarda um objeto JSON com: revision, scenario, strategy (baseline/delegated),
toolVersion, modelRoles, inputTokens, outputTokens, cachedTokens, cost, currency,
elapsedSeconds, retries, passedCriteria, failedCriteria, evidencePaths.
Medidas indisponiveis sao null, nunca zero. EvidencePaths aponta para diffs, testes e logs locais
sem credenciais. Nao guardar chain-of-thought; apenas decisoes resumidas e resultados observaveis.

Aprovar eficiencia apenas se os criterios obrigatorios nao regredirem e o custo total observado
for inferior em tarefas comparaveis. Reportar variacao e custos de orquestracao/revisao.
Para testar descoberta, empacotar skills num diretorio novo, abrir o projeto no IDE, confirmar
os 35 nomes e invocar 08-auth e 33-orchestration. Uma verificacao de pastas nao substitui este teste.
