# Sistema de Alerta de Inundação - Bairro Mubungo, Bengo

Sistema web completo para monitorização, alerta e gestão de risco de inundação no Bairro Mubungo, Província do Bengo (Angola).

## Como executar

**Opção rápida:** abra o ficheiro `index.html` diretamente no Google Chrome (duplo clique).

**Opção recomendada (necessária para ligação real a Arduino/ESP32 via USB e impressão Bluetooth):**

1. Abra um terminal dentro da pasta do projeto.
2. Execute: `python -m http.server 8000` (ou qualquer outro servidor local).
3. Abra o Google Chrome e aceda a `http://localhost:8000`.

## Contas de demonstração

| E-mail | Senha | Perfil |
|---|---|---|
| admin@bengo.gov.ao | Admin@123 | Administrador |
| tecnico@bengo.gov.ao | Tecnico@123 | Técnico |
| voluntario@bengo.gov.ao | Voluntario@123 | Voluntário |
| usuario@bengo.gov.ao | Usuario@123 | Usuário |

## Estrutura do projeto

```
index.html          - página principal
css/style.css        - estilos, temas e menu
js/                  - toda a lógica do sistema (ver docs/ para detalhe)
assets/icons/        - ícones e avatar padrão
diagrams/            - diagramas UML (caso de uso, classes, sequência, atividades)
docs/                - documentação técnica completa (.docx)
```

## Documentação completa

Consulte `docs/Documentacao_Sistema_Alerta_Inundacao_Mubungo.docx` para a descrição completa do sistema, tecnologias utilizadas, arquitetura, módulos, perfis de acesso e instruções de ligação a hardware real (Arduino Uno / ESP32).

## Requisitos

- Google Chrome (ou outro navegador baseado em Chromium) atualizado.
- Para ligação real a sensores: cabo USB e placa Arduino Uno ou ESP32 programada para enviar leituras em JSON pela porta série.
- Ligação à internet apenas necessária para carregar as bibliotecas externas (Bootstrap, Leaflet) e o mapa; o restante funciona offline, incluindo o alerta sonoro.
