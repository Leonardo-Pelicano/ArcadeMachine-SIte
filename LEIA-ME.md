# Atualização V18 — instrumentos, renda e anéis

- Medidores maiores de combustível, casco, auxiliar e escudo; rota vertical até a Lua com altitude atual e recorde do voo.
- Renda prevista mostra pagamento do voo (altura e tempo), coleta e conquistas. A carteira recebe o total uma única vez no encerramento.
- Conquistas são avisadas durante o voo; o marco de voo preciso permanece conquistado se houver uma colisão posterior.
- Anéis permanecem no mapa durante o voo. Cruze o centro alinhado para receber impulso; tocar as estruturas laterais causa impacto e dano. Podem ser reutilizados após nova passagem e intervalo de dois segundos. O impulso não consome combustível.
- Salvamento e retomada preservam impulso, anéis e conquistas anunciadas.

Verificação: testes de física e economia, campanha até a Lua, interfaces com DOM simulado e desenhos Canvas em CPU. Não houve teste em navegador real/GPU nem celular físico nesta atualização.

# Arcade Machine — V17 / Projeto Selene — Laboratório Pelicano

## Abrir e hospedar

Extraia TODO o ZIP em uma pasta nova e abra index.html. Mantenha assets/, vendor/ e os arquivos JavaScript juntos. O HTML único Arcade-Machine-v17.html incorpora código, fontes, imagens e áudio. Não precisa de servidor para jogar. Para hospedar, publique esta pasta em um serviço de arquivos estáticos com HTTPS. O link index.html?game=drift abre diretamente a garagem; o endereço normal mantém a abertura e a biblioteca dos cinco jogos.

O áudio começa após uma interação. SOM e MÚSICA são independentes. A corrida pausa ao perder o foco ou sair da aba.

## Circuito 87 — oito pistas, seis carros, oito pilotos

Escolha uma corrida avulsa ou dispute as oito etapas do campeonato. São três voltas por pista e sete rivais com carros, ritmo e planos de ultrapassagem próprios. A pontuação por etapa é 15, 12, 10, 8, 6, 4, 2 e 1. Empates no campeonato usam a posição da última etapa. Quem ainda está correndo ao cruzar sua chegada aparece como NA PISTA, ordenado pelo progresso naquele momento.

### Circuitos

1. COSTA AURORA — curvas abertas, palmeiras, vilas, farol, oceano, veleiros e rampas.
2. DISTRITO NEON — prédios, painéis luminosos, asfalto noturno, túnel e chuva.
3. CÂNION SOLAR — subidas, paredões, arcos e rochas que atravessam a estrada.
4. GELEIRA LUNAR — montanhas, cristais, aurora, neve e faixas de gelo.
5. ÓRBITA 87 — pista elevada, estação, naves, planeta e saltos entre portais.
6. SERRA DO ECLIPSE — NOVA: cinco retornos de 180 graus, pista estreita e mudanças de elevação.
7. PÁTIO 87 — NOVA: cotovelos de noventa graus, retornos e chicanes entre estruturas urbanas.
8. SERPENTE BOREAL — NOVA: curvas em S ligadas, retornos apertados e gelo entre as curvas.

As três pistas novas têm traçados próprios, largura menor e mais curvas fechadas. Placas FREIE antecipam curvas fortes; os chevrons indicam a direção da curva. Cada circuito tem minimapa, contagem de voltas e recorde próprio. A V11 inicia uma tabela de tempos separada porque a direção passou a ser manual; os tempos anteriores ficam preservados na chave da V10.

### Carros

COMETA GT (equilibrado), VESPER R (ágil), ATLAS V8 (velocidade e massa), PULSE RX (aceleração), NÉBULA X (drift) e APEX F1 (monoposto com rodas expostas, piloto, halo e asas). As carrocerias são modelos originais gerados localmente, com rodas animadas, painéis arredondados, vidro, faróis e detalhes próprios. Peso e aderência influenciam a pilotagem e os impactos.

## Direção, freio de mão e drift

No computador, segure W ou ↑ para acelerar; soltar W/↑ desacelera por resistência. A/D ou ←/→ esterçam as rodas; S/↓ freia. O carro não acompanha a curva do mapa sozinho: sem esterçar ele mantém sua orientação no mundo. R reposiciona o carro na direção da pista, parado, com penalidade de 2 segundos. No celular a aceleração continua automática. Segure Shift, o clique esquerdo sobre a pista/campo de controle ou o botão DRIFT para puxar o freio de mão. Espaço/E usa o item; P pausa; ESC volta à biblioteca. Enter confirma a largada ou continua após o resultado. Clicar na pista não reinicia uma corrida encerrada.

No celular, arraste no campo abaixo ou ao lado da pista para dirigir. Com outro dedo, segure DRIFT ou FREIO. O campo separado evita esconder o carro. No modo horizontal os controles ficam ao lado da arena.

O freio de mão aplica frenagem real: há perda inicial e contínua de velocidade e queda da aderência traseira. A orientação da carroceria e a direção de deslocamento podem se separar. Contraesterçar reduz o ângulo de derrapagem; insistir na mesma direção aumenta a instabilidade. Segurar por tempo excessivo pode causar uma rodada e perda de ritmo. O F1 e os carros de aderência maior recuperam a tração de forma diferente.

Para uma manobra limpa: reduza antes da curva, puxe brevemente o freio de mão ao iniciar a rotação, corrija a traseira na direção oposta, solte e espere os pneus recuperarem a aderência. Segurar o freio em linha reta não carrega bônus. A carga depende de ângulo, velocidade e controle dentro da pista. Um pequeno impulso é concedido apenas depois da recuperação da tração; bater, sair da pista ou perder o controle cancela a manobra. Não é um turbo automático ao soltar.

O HUD mostra o ângulo e avisa quando é preciso contraesterçar. Marcas de pneus, fumaça e som de derrapagem acompanham a perda de aderência no cenário 3D.

## Colisões

A detecção usa caixas orientadas pelas carrocerias. Batidas traseiras transferem impulso; toques laterais empurram e podem alterar a orientação. A massa influencia a resposta. Raspadas não retiram a mesma velocidade de uma batida forte. Carros lado a lado na mesma velocidade não sofrem uma penalidade fixa de velocidade a cada toque.

Nas barreiras, a perda de ritmo e o rebote dependem do ângulo e da velocidade de aproximação. Faíscas aparecem no ponto do contato, com reação da carroceria e tremor breve da câmera. Há proteção contra som repetido a cada quadro, sobreposição permanente e contagem duplicada de volta depois de um empurrão na linha de chegada. Saltos podem passar por cima de outros carros.

## Itens e recordes

TURBO impulsiona por 2,8 s; ESCUDO absorve um impacto; PULSO atinge um rival à frente a até 95 m; ECO deixa uma armadilha na sua linha. Cristais entregam itens e setas douradas dão impulso. Os NPCs também os usam.

Preferência de carro/pista, tempos e melhor pontuação do campeonato são locais ao navegador. A V10 mantém os recordes desta física separados dos recordes antigos, preservando os dados anteriores e migrando apenas a preferência de carro e pista. Não há sincronização entre aparelhos nem retomada de uma corrida depois de fechar a página.

## Os outros três jogos

ARCADE ZONE: Space Shooter com aliens resistentes, cinco fases, chefes, lasers anunciados e transformação final. WASD/setas movem; clique/espaço atira. No celular, arraste com disparo automático moderado. A nave volta ao início a cada fase.

CABINE DE PILOTAGEM: desvie de asteroides, colete cristais, atravesse portais e carregue escudos. Mouse, WASD ou arrasto pilotam.

PRISMA REACTOR: quebre cristais em três câmaras, com multiesferas, plataforma maior e escudo. Mouse, setas ou arrasto movem; clique/espaço ou o primeiro arrasto lança.

Os três preservam o reinício explícito por Enter ou pelo botão da tela de resultado.

## Arquivos e testes

- index.html / styles.css: biblioteca, garagem, pistas, HUD e layout responsivo.
- app.js: navegação, abertura, dificuldade e áudio global.
- drift-data.js: carros, rivais, oito circuitos e elementos de pista.
- drift-dynamics.js: NOVO — aderência traseira, frenagem, derrapagem, recuperação e contatos por impulso.
- drift-physics.js: simulação fixa, percurso, IA, voltas, itens e integração da dinâmica.
- drift-renderer.js / drift-models.js / drift-world.js: veículos, cenários, câmera, efeitos e alternativa Canvas 2.5D.
- drift.js: garagem, campeonato, controles, HUD, áudio e recordes.
- touch-controls.js: gestos dos cinco jogos.
- games.js / prism.js / gameplay-fx.js: outros jogos e efeitos.
- assets/: fontes, imagem original e áudio com créditos CC0.
- vendor/: Three.js e licença MIT.

Testes opcionais, com Node e sem dependências de desenvolvimento:

    node tests/drift-dynamics.cjs
    node tests/drift-physics.cjs
    node tests/drift-manual.cjs
    node tests/selene-physics.cjs

A V11 foi verificada com simulação de três voltas nos oito circuitos usando um piloto externo somente de teste, física de drift/colisões, aceleração manual e ausência de direção automática. O novo jogo passou por testes de combustível, compras, danos, propulsores, dias, retomada determinística, pagamento único e campanha completa até a Lua. A interface foi exercitada em DOM simulado e as cenas Canvas 2D renderizadas em CPU, incluindo formato vertical. As oito cenas 3D também foram construídas em CPU.

A prévia em navegador/GPU e um celular físico não estavam disponíveis nesta revisão. Testes de DOM não medem layout real, e simulações não substituem uma sessão humana de balanceamento. O Neon Drift inclui alternativa Canvas 2.5D quando WebGL não está disponível.

## Projeto Selene — Laboratório Pelicano / V12

Abra index.html?game=selene. A nova campanha começa com uma abertura em seis cenas no laboratório do doutor Pelicano. Há diálogo entre cientista e piloto, texto progressivo e animação do personagem. Enter ou CONTINUAR completa a fala e avança; PULAR leva à oficina. REVER A HISTÓRIA permite repetir a abertura. A voz em português é opcional e usa a síntese do navegador quando disponível; não é dublagem gravada e pode não funcionar offline. As legendas estão sempre disponíveis. SOM e VOZ podem ser desligados separadamente.

O jogo é uma homenagem baseada em Into Space!, de BarbarianGames. A atribuição aparece junto do nome na biblioteca e no cabeçalho. Página do jogo original consultada: https://www.kongregate.com/en/games/barbariangames/intospace . Os personagens, diálogos, desenhos e código desta versão são próprios. Não foram copiados arquivos nem falas do original.

### Oficina e progressão

Comece com um protótipo e sem dinheiro. Cada lançamento inicia um dia. O rendimento do voo, as coletas e nove bolsas/medalhas financiam novas peças. O foguete é reparado e reabastecido antes de cada lançamento. Há oito sistemas com seis níveis: motor, tanque, eficiência, propulsores auxiliares, casco, controle/aletas, coletor magnético e escudo regenerativo.

Escolha o sistema e um nível para comparar o atributo atual com a prévia. Você pode pular níveis se puder pagar a peça escolhida; não há reembolso das peças anteriores. A arte do foguete mostra mudanças no tanque, propulsores, proteção e aletas. A prévia é identificada; comprar aplica a peça ao próximo voo. Um voo salvo bloqueia as compras até ser retomado ou encerrado.

Pelicano comenta os testes, compras, impactos e marcos da rota. O relatório mostra altitude máxima, renda, bolsas e saldo acumulado. A arena não reinicia ao receber um clique. Enter ou VOLTAR À BANCADA prepara o próximo dia.

### Pilotagem

No teclado, A/D ou ←/→ giram o foguete. A orientação é mantida ao soltar: corrija para o lado oposto. ↑, W ou Espaço acionam o propulsor auxiliar enquanto pressionados. ↓/S corta o motor enquanto estiver pressionado; E alterna o motor. P pausa; ESC volta à biblioteca. A oficina permite escolher TECLADO ou MOUSE.

No modo MOUSE, o foguete aponta para o cursor; aproximar o cursor do foguete corta o motor. Segurar o clique esquerdo sobre a arena usa o propulsor. Soltar ou cancelar o ponteiro interrompe o impulso. No celular, arraste no campo separado, solte para estabilizar e use MOTOR e AUXILIAR com outro dedo. Os recursos do motor e do propulsor são independentes.

### Colisões, obstáculos e suprimentos

O casco é testado como uma cápsula alongada orientada com o foguete. Colidir separa os corpos e aplica impulso, perda de velocidade, rotação e dano conforme a velocidade relativa atual. A câmera treme, o casco pisca e os impactos geram faíscas, fragmentos e números de dano. Um mesmo objeto tem um intervalo de contato para evitar dano por quadro.

Aviões, satélites, drones e asteroides continuam visíveis como destroços em queda, girando por vários segundos. Balões estouram com fragmentos que desaparecem gradualmente; pássaros se afastam. Nuvens elétricas permanecem na rota e podem causar novos choques depois de um intervalo. A destruição do foguete tem uma sequência de queda antes do relatório, em vez de cortar imediatamente para a oficina.

Coletas têm animação e texto de retorno: dinheiro, combustível, reparos, cargas auxiliares e escudos. As tempestades e o vento ficam nas camadas inferiores; o espaço tem satélites, asteroides, OVNIs e anéis de impulso. Fronteiras da rota fornecem reabastecimento parcial uma vez por voo. O escudo melhorado se regenera após um período sem dano. A dificuldade difícil causa mais dano e rende 15% extra na renda do voo.

### Salvamento e escala

O progresso e o voo são salvos neste navegador a cada dois segundos, ao pausar ou sair. Retomar não gasta outro dia; encerrar credita a renda uma única vez. Há histórico dos últimos voos e resgate na pausa. NOVA CAMPANHA exige confirmação e reinicia apenas a campanha Pelicano.

Como a física e a economia mudaram, a V12 usa uma nova campanha (chave arcade-selene-pelicano-v2), iniciada pela apresentação. Os dados antigos da V11 permanecem intactos na chave arcade-selene-campaign-v1 e podem ser usados ao abrir a V11. O progresso não é transferido automaticamente entre navegadores, aparelhos ou origens do site.

A rota usa 48.000 unidades com escala arcade comprimida até a chegada à Lua e pouso assistido. Não há simulação de órbitas reais. Uma campanha foi concluída em 11 dias por um piloto automatizado externo de teste, que desvia e busca suprimentos; esse piloto não existe no jogo entregue. Isso verifica que a progressão é possível, sem prometer o mesmo desempenho para uma pessoa.

Arquivos: rocket-data.js (economia/atributos), rocket-physics.js (voo, contatos e campanha), rocket-renderer.js (arte original Canvas de Pelicano, laboratório e voo) e rocket.js (diálogos, oficina, controles, áudio e salvamento).

Testes Selene adicionais:

    node tests/selene-physics.cjs
    node tests/selene-campaign.cjs

A V12 passou por testes DOM de abertura completa, pular/rever, oito módulos/seis níveis, compras, controles de teclado/mouse/toque, pausa, retomada, proteção contra reinício ao clicar e confirmação de nova campanha. Os contatos foram testados de frente/lado, com destroços persistentes, balões, nuvens, escudos e sequência de destruição. Cenas de laboratório, oficina, voo vertical, chegada e impactos foram renderizadas em Canvas 2D na CPU. A revisão não foi validada em navegador com GPU ou celular físico; testes DOM não medem layout real.

## Referências da adaptação arcade

Conceitos de forças longitudinais/laterais, ângulo de derrapagem e perda de aderência orientaram a implementação original deste projeto. Não é um simulador automotivo completo.

- Marco Monster, Car Physics for Games: https://www.asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
- Unity, Wheel collider friction: https://docs.unity.com/en-us/engine/6000.0/manual/physics-section/physics-overview/collision-section/collider-shapes/wheel-colliders/friction

O projeto roda em JavaScript/Three.js; a documentação da Unity foi consultada como referência conceitual. Músicas e efeitos mantêm os créditos em assets/audio/CREDITS.md. Motor e pneus usam som sintetizado localmente.

## Ajustes da V13

O foguete ganhou mais empuxo e maior velocidade máxima. A gravidade foi aumentada e a resistência na queda reduzida: em um ensaio sem obstáculos, o protótipo sobe cerca de 259 unidades nos primeiros cinco segundos de motor, contra 93 na V12; partindo do repouso a 12.000 unidades, cai cerca de 58 unidades em dois segundos, contra 18. Tanques, preços e progresso salvo foram mantidos. A progressão foi novamente concluída por simulação.

Plataforma e foguete agora usam a mesma referência de chão. As aletas apoiam no topo da plataforma durante a contagem, a altitude exibida começa em zero e o apoio também foi alinhado na bancada e na abertura. A câmera muda suavemente de posição ao começar a descida.

A hélice dos aviões tem quatro pás animadas e desacelera nos destroços. Pelicano foi redesenhado com contornos curvos, sombreamento do rosto/jaleco, lentes e cabelo mais suaves. A resolução do Canvas acompanha telas de alta densidade até 2,5 vezes.

A V13 continua usando a campanha Pelicano da V12 (arcade-selene-pelicano-v2), sem reiniciar os dias ou as compras.

    node tests/selene-flight-feel.cjs

## Ajustes da V14

Pelicano agora tem pescoço ligando a cabeça ao colarinho, dedos desenhados por um contorno fechado e detalhes na mão que segura a chave.

No PC, o Selene inicia com MOUSE: o foguete aponta para o cursor e o acompanha continuamente, inclusive quando o cursor fica parado. A direção pode dar uma volta completa, com rotação pelo caminho mais curto; o motor continua produzindo o movimento, sem teletransportar o foguete. Segure o clique esquerdo para usar o propulsor e aproxime o cursor da nave para cortar o motor. Os controles de toque permanecem no campo separado.

O modo padrão também é aplicado uma vez aos saves anteriores, sem alterar dinheiro, dias ou peças. Depois disso, a opção TECLADO continua disponível e sua escolha é preservada.

Neon Drift: W ou ↑ acelera; soltar desacelera. S ou ↓ freia. A/D ou ←/→ esterçam. Shift/clique continua acionando o drift. As instruções da garagem, corrida e biblioteca foram atualizadas.

Validação: fluxo completo em DOM simulado, entradas W/setas e freio, cursor parado, alvo abaixo da nave e mira de 360 graus; desenho conferido por renderização Canvas em CPU. Sem validação de layout em navegador real ou celular físico nesta revisão.

## Ajustes da V15

A velocidade foi moderada entre a V12 e a V14: em teste sem obstáculos, o protótipo percorre aproximadamente 184 unidades nos primeiros cinco segundos de motor, contra 93 na V12 e 259 na V14. Empuxo, propulsor auxiliar e velocidade máxima por nível foram reduzidos; gravidade e resistência da queda receberam ajuste menor, para manter a descida responsiva. A campanha foi novamente concluída por simulação. O progresso, os controles por cursor e os comandos W/setas da corrida foram mantidos.

Os aviões foram redesenhados como biplanos vistos de lado: fuselagem arredondada, asas paralelas, suportes, cabine integrada, motor e trem de pouso. A hélice agora usa duas pás animadas, com rotação menor nos destroços. O desenho mantém a direção de frente depois do impacto, sem espelhar abruptamente quando a velocidade muda.

Os coletáveis passaram a ter silhuetas próprias: moedas douradas (dinheiro), galão com alça e gota (combustível), maleta com cruz (reparo), cápsula propulsora (auxiliar) e brasão azul (escudo). Contornos e sombras são consistentes, sem girar os ícones de um lado para o outro. Os efeitos de coleta, colisões e salvamento continuam ativos.

Validação em simulação, DOM e renderização Canvas em CPU; ainda sem sessão em navegador real ou celular físico nesta revisão.

## Revisão visual da V16

O restante dos objetos do Selene recebeu o mesmo acabamento dos aviões e coletáveis:

- Balão: tecido com painéis e costuras, cabos e cesto trançado; o estouro deixa tecido e cesto em queda antes de desaparecer.
- Satélite: corpo com revestimento dourado, painéis solares em células, antenas, parabólica e luz de estado; destroços têm painéis trincados.
- Drone: quatro rotores animados, braços, câmera, bateria e trem de pouso.
- OVNI: cúpula com reflexo, pequeno piloto, casco metálico e luzes sequenciadas; perde brilho e ganha rachaduras após um impacto.
- Asteroide: silhueta irregular, faces, crateras, rotação lenta e fraturas.
- Pássaro: corpo, cabeça, bico, cauda e asas animadas; foge depois do contato.
- Nuvem elétrica: contorno contínuo, volume, chuva e relâmpago localizado.
- Anel de impulso: estrutura metálica, módulos de energia e setas pulsantes.
- Cenário: Terra e Lua com iluminação e detalhes, nuvens de fundo, torre de lançamento, prédio do laboratório, console, barril, caixa de ferramentas e frascos. O foguete ganhou acabamento nos painéis e reflexos.

A arte dos novos objetos está separada em rocket-art.js, carregado antes de rocket-renderer.js. Os scripts são clássicos, locais e incorporados no HTML único. Contatos usam regiões próprias para cesto do balão, painéis do satélite, rotores, casco e cúpula, com rotação dos destroços. Fragmentos seguem a cor/material do objeto.

A velocidade, os controles por cursor, a economia e os dados salvos da V15 foram mantidos. A campanha foi concluída novamente por simulação (11 dias do piloto externo de teste); isso confirma a progressão possível, sem representar uma partida humana.

Validação adicional: 96 quadros de objetos normais/danificados/animados; equilíbrio de save/restore do Canvas; coordenadas finitas; contatos em cesto, painéis e destroço girado; cenas em formato horizontal e vertical; fluxo completo em DOM e pacote offline. Não houve validação em navegador com GPU ou celular físico nesta revisão.

    node tests/selene-object-contacts.cjs

## V17 — oficina por modelos, voo limpo e pane elétrica

### Tela de voo e tela cheia

No computador, o HUD mostra altitude, dinheiro e uma faixa compacta de combustível, casco e auxiliar. O escudo aparece apenas quando disponível. Os mostradores circulares, a régua vertical, a barra de rota, as mensagens de rádio permanentes e o rodapé de instruções foram retirados da arena. Não há campo de arraste nem botões MOTOR/AUXILIAR no PC; o mouse continua guiando, segurando o clique usa o auxiliar e aproximar o cursor do foguete corta o motor.

OPÇÕES reúne áudio, modo de controle e ajuda. Abrir esse menu pausa o voo; fechá-lo retoma somente se o jogador não havia pausado antes. No celular ou ao detectar toque real, o campo de arraste e os dois botões permanecem disponíveis. Voltar a usar mouse recolhe esses controles.

O botão TELA CHEIA ou a tecla F usa a API de tela cheia do navegador. Quando essa API não está disponível ou é recusada, ativa um modo expandido dentro da janela, mantendo as barras do navegador. Escape sai desse modo antes de sair do jogo. A mudança de tamanho preserva a corrida/voo e a seleção da oficina.

### Oficina de modelos

A referência de organização é a oficina de Into Space!, com peças em linhas e prévia montada ao lado. Há cinco linhas principais (casco, aletas, motor, tanque e auxiliar) e três categorias de eletrônica em um painel expansível (injeção, coletor e escudo). Cada linha mostra o modelo original e seis modelos de melhoria, com desenhos próprios e preço/estado.

Passar o mouse mostra uma prévia temporária. Clicar mantém a seleção; COMPRAR confirma a compra, e EQUIPAR aplica modelos já adquiridos sem cobrar de novo. A prévia não modifica o foguete real até essa confirmação. As miniaturas e a montagem usam os mesmos desenhos em rocket-parts.js; casco, aletas, bocal do motor, tanque e propulsores realmente mudam na prévia e no voo. Os atributos atual/selecionado aparecem no painel lateral.

Os modelos anteriores de uma categoria permanecem adquiridos, inclusive nos saves migrados da V16. Reequipar um modelo menor não apaga os maiores. Compras e trocas ficam bloqueadas durante um voo salvo. Dias, dinheiro, conquistas e peças anteriores são preservados.

### Descarga elétrica

Entrar em uma nuvem elétrica desativa motor, auxiliar, direção, atração magnética e recarga de escudo por aproximadamente 2,2 segundos. O escudo melhorado reduz um pouco esse tempo, sem anular a pane. Inércia, gravidade e colisões continuam funcionando; combustível e reserva auxiliar não são consumidos enquanto os motores estão desligados. Um indicador contextual mostra o tempo restante e arcos elétricos aparecem ao redor da nave.

Ao reiniciar os sistemas, existe uma pequena imunidade contra nova descarga para permitir sair da nuvem. A pane e a intenção de manter o motor ligado são salvas no checkpoint: retomar um voo não deixa o motor desligado permanentemente por causa do choque.

### Pelicano e arquivos

Pelicano recebeu uma nova ilustração original com pintura, sombras, textura de tecido, mãos e pescoço definidos. O PNG transparente fica em assets/pelicano-illustrated.png e é incorporado no HTML único. rocket-portrait.js carrega a imagem, com desenho vetorial de reserva durante o carregamento. A abertura e as falas continuam disponíveis.

Novos arquivos: rocket-parts.js (componentes e montagem compartilhados), rocket-portrait.js (ilustração) e tests/selene-systems.cjs (pane, retomada e inventário). A velocidade de voo e os controles de corrida da V16 foram mantidos.

    node tests/selene-systems.cjs

Validação: 56 miniaturas e montagens visualmente distintas em Canvas CPU, nova ilustração carregada, contatos e animações, campanha completa por simulação, fluxo DOM de compra/reequipamento, HUD de PC/toque, opções com pausa, mudança de dispositivo, pane com checkpoint, tela cheia nativa simulada e modo expandido, Escape e pacote offline. A API nativa foi simulada nos testes; não houve conferência em navegador real/GPU nem em celular físico neste ambiente.
