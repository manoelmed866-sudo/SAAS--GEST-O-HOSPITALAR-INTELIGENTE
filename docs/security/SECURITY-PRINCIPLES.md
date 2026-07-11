# SECURITY-PRINCIPLES.md

## Principios de seguranca

Este documento registra os principios de seguranca que devem orientar as proximas sprints.

Os principios de seguranca devem proteger a Visao Funcional Completa, mesmo quando a Primeira Versao Operacional implemente apenas um recorte inicial.

## Isolamento entre hospitais

- A plataforma deve ser preparada para multiplos hospitais.
- Dados de um hospital nao podem ser acessados por outro hospital.
- Usuarios, perfis, protocolos, formularios, pacientes, episodios, exames, recursos, indicadores e alertas devem respeitar contexto institucional.
- O isolamento deve ser aplicado no desenho da aplicacao, no servidor e no banco de dados quando essas camadas existirem.

## Menor privilegio

- Usuarios devem receber apenas as permissoes necessarias para sua funcao.
- O acesso deve seguir necessidade, finalidade e contexto.
- Acesso administrativo deve ser restrito.
- Funcao administrativa nao deve conceder automaticamente acesso clinico.
- Operacoes sensiveis devem exigir permissao especifica.
- Permissoes devem ser revisaveis e auditaveis.

## Acesso contextual

- A autorizacao deve considerar organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo assistencial, responsabilidade atribuida, finalidade do acesso e situacao do usuario.
- Um perfil nao deve receber acesso clinico irrestrito apenas por possuir determinado nome de funcao.
- O modulo Inicio e a area do paciente podem mudar conforme perfil, mas a interface nao substitui autorizacao no servidor e no banco.
- Administradores configuram instituicoes, unidades, usuarios, perfis e permissoes, mas acessos clinicos excepcionais devem ser controlados e auditados.
- Auditores devem possuir acesso somente leitura ao escopo autorizado.

## Protecao de dados

- Dados sensiveis devem ser tratados com cuidado desde o desenho da arquitetura.
- Durante desenvolvimento, testes e demonstracoes, somente dados ficticios podem ser utilizados.
- Dados reais de pacientes, profissionais ou hospitais nao devem ser inseridos no ambiente de desenvolvimento.
- Campos sensiveis devem ser exibidos apenas a usuarios autorizados.

## Auditoria

- Operacoes sensiveis devem gerar registro de auditoria.
- Auditoria deve incluir usuario, hospital, acao, entidade afetada, horario e contexto.
- Alteracoes em protocolos, formularios, permissoes, decisoes e registros assistenciais devem ser rastreaveis.
- Consultas sensiveis devem ser rastreaveis quando aplicavel.
- Evolucoes, complementacoes, retificacoes, acessos a historico longitudinal e acessos a anexos sensiveis devem preservar autoria e contexto.
- Logs nao devem expor segredos ou dados sensiveis desnecessarios.

## Autoria e preservacao de registros

- Evolucoes assistenciais devem ter autoria profissional identificada.
- O sistema nao deve atribuir a si mesmo conteudo clinico como se tivesse sido escrito por profissional.
- Evolucoes finalizadas devem preservar o conteudo registrado.
- Complementacao acrescenta informacao posterior sem apagar o original.
- Retificacao identifica correcao e mantem vinculo com registro original.
- Autor, data, hora e justificativa devem ser rastreaveis conforme regra institucional.
- Regras definitivas de assinatura, validade, retencao e correcao devem passar por validacao institucional e juridica antes de producao.

## Anexos privados

- Anexos devem ser privados por padrao.
- Acesso a anexos deve depender de autorizacao.
- URLs publicas permanentes devem ser evitadas para documentos sensiveis.
- Download, visualizacao e alteracao de anexos sensiveis devem ser auditaveis quando implementados.
- Anexos de evolucao devem respeitar contexto de acesso, vinculo assistencial e auditoria quando aplicavel.

## Ausencia de dados reais no desenvolvimento

- Ambientes de desenvolvimento devem usar apenas dados ficticios.
- Bases de teste nao devem conter informacoes reais.
- Exemplos de documentacao devem ser ficticios e nao identificaveis.

## Seguranca por camadas

- Validar no cliente para melhorar experiencia e reduzir erros simples.
- Validar no servidor como barreira obrigatoria.
- Validar no banco de dados quando houver regras de integridade e autorizacao aplicaveis.
- Aplicar autorizacao no servidor e no banco.
- Aplicar autorizacao tambem na interface, sem depender exclusivamente dela.
- Nao confiar apenas na interface para proteger dados.
- A Primeira Versao Operacional nao deve criar atalhos de seguranca incompativeis com expansoes futuras da Visao Funcional Completa.

## Segredos e configuracoes

- Segredos nao devem ser versionados.
- Chaves, tokens, senhas e credenciais nao devem aparecer em documentacao, codigo, commits ou logs.
- Variaveis de ambiente devem ser documentadas sem expor seus valores reais.

## Corolario

Seguranca nao sera uma etapa final. Ela deve orientar cada sprint, principalmente onde houver dados assistenciais, usuarios, hospitais, anexos, decisoes, auditoria e configuracoes institucionais.

## Validacao futura

- As regras definitivas de acesso, assinatura, validade, retencao, correcao, exportacao e auditoria exigem validacao institucional e juridica.
- Esta documentacao nao afirma conformidade legal completa.
