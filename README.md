# 📚 Buscador de Livros

Este projeto é uma aplicação web interativa que permite aos usuários pesquisar livros utilizando APIs externas, como **Google Books** e **Open Library**, com recursos de filtragem, ordenação, exibição detalhada e integração com Inteligência Artificial (Google Gemini) para geração de descrições.

![Screenshot_5](https://github.com/user-attachments/assets/8c12f115-f168-419b-95cf-52b3709a6abf)

## ✨ Funcionalidades.

- 🔍 Busca por título, autor, editora e categoria
- 📊 Filtros e ordenação por relevância, mais recentes, título (A-Z) ou autor (A-Z)
- 📘 Exibição dos resultados em cartões com imagem, autor, metadados e links
- 🧠 Geração de descrições por IA (Google Gemini)
- 📄 Modal com detalhes completos do livro
- 🔁 Descoberta de livros aleatórios (função de exploração)

## 📁 Estrutura do Projeto

📄 index.html # Estrutura da interface.

📄 styles.css # Estilização responsiva em dark mode.

📄 api.js # Comunicação com APIs externas.

📄 search.js # Lógica de busca e manipulação DOM.

📄 gemini.js # Integração com API de IA (Google Gemini).

📄 Screenshot_5.png # Imagem ilustrativa da aplicação.

## 1. Introdução
 
O presente relatório descreve o desenvolvimento de uma aplicação web 
interativa denominada "Buscador de Livros". Trata-se de um sistema front-end voltado 
à busca de livros a partir de múltiplas fontes externas (APIs), com foco em 
acessibilidade, clareza visual e suporte a funcionalidades avançadas como filtragem, 
ordenação, modal com detalhes e integração com inteligência artificial para geração 
de descrições enriquecidas.

O contexto que motivou o desenvolvimento deste sistema é a crescente 
demanda por soluções que melhorem a descoberta e o acesso a informações 
bibliográficas na era digital. Em um cenário onde vastas quantidades de dados estão 
disponíveis através de APIs públicas, torna-se fundamental dispor de ferramentas que 
filtrem, organizem e apresentem esses dados de forma inteligível e personalizada ao 
usuário. A proposta do Buscador de Livros visa, portanto, atender a esse desafio, ao 
mesmo tempo em que explora o uso de recursos modernos de desenvolvimento web 
e aprendizado de máquina para aprimorar a experiência final.

A aplicação foi desenvolvida utilizando HTML5, CSS3 e JavaScript ES6+, e 
integra duas fontes principais de dados: a API do Google Books e a API do Open 
Library. Além disso, a aplicação pode se integrar à API generativa Gemini (Google AI) 
para melhorar a experiência do usuário.

Com uma interface responsiva e foco na usabilidade, o sistema permite que 
qualquer usuário com conexão à internet realize buscas refinadas por título, autor, 
editora ou categoria. Os resultados são apresentados de forma visualmente clara e 
podem incluir descrições geradas automaticamente por inteligência artificial, 
enriquecendo ainda mais o processo de descoberta e seleção de livros.

Além de sua aplicação prática, o projeto também se propõe como uma 
plataforma educacional e de extensão, que pode ser utilizada em contextos 
acadêmicos para o ensino de integração com APIs, manipulação de dados 
estruturados, design de interfaces e introdução à IA generativa aplicada à web.

## 2. Estrutura Geral e Interface

![Screenshot_5](https://github.com/user-attachments/assets/8c12f115-f168-419b-95cf-52b3709a6abf)

O projeto é composto por cinco arquivos principais: index.html, styles.css, 
api.js, gemini.js e search.js.

O index.html contém a estrutura principal da interface. Inclui um campo de 
busca, um menu de filtros e botões de interação, os resultados são exibidos 
dinamicamente em uma área dedicada, sendo que cada item de livro possui imagem, 
metadados e descrição.

O styles.css define um tema escuro responsivo. A estética moderna é 
sustentada por Flexbox, sombras suaves e transições visuais,o layout se adapta bem 
às diferentes dimensões de tela, priorizando usabilidade em dispositivos móveis e 
desktops.

## 3. Funcionalidades JavaScrip

As funcionalidades interativas da aplicação estão divididas entre os arquivos 
api.js, search.js e gemini.js.

No api.js, são definidas as conexões com as APIs de livros. Duas funções 
principais realizam buscas em cada fonte:

async function searchGoogleBooks(query, options) { ... }
async function searchOpenLibrary(query, options) { ... }

Essas funções formatam a URL da busca conforme os filtros definidos pelo 
usuário. Após o fetch, os dados brutos são mapeados em objetos padronizados 
contendo title, authors, publisher, publishedDate, description, categories, thumbnail, 
pageCount, language, entre outros.

O search.js coordena os eventos da interface. O evento DOMContentLoaded 
associa listeners aos elementos DOM, como botões e campos de texto. A função 
performSearch() é a principal responsável por orquestrar a busca, mostrando o 
carregamento, montando as opções de filtro, enviando a requisição à API apropriada 
e exibindo os resultados.

async function performSearch() {
 const searchTerm = document.getElementById('searchInput').value;
 const options = { fields: { title: true, author: true }, sort: 'relevance' };
 const result = await window.searchBooks(searchTerm, options);
 displayResults(result, useGemini);
}

Além disso, existe suporte a busca por clique, tecla Enter, aplicação de filtros, 
descrições via IA, e exibição em modal.

## 4. Integração com IA: gemini.js

O arquivo gemini.js integra a API do Google Gemini para enriquecer descrições 
dos livros e gerar interpretações criativas para os termos de busca.

A função generateBookDescription(book) monta um prompt baseado nos 
dados do livro, enviando-o à API Gemini via fetch:

async function generateBookDescription(book) {
 const prompt = buildBookPrompt(book);
 const response = await fetch(`${apiUrl}?key=${apiKey}`, { method: 'POST', ... });
 return respostaGerada;
}

Caso a chave de API não esteja ativa, uma descrição fallback é gerada localmente 
com base nos metadados.

## 5. Estruturas de Dados e Algoritmos

Foram utilizadas estruturas como arrays (para listas de livros, autores, termos 
aleatórios) e objetos (para configuração de APIs, representação de livros, opções de 
busca).

Um dos algoritmos essenciais é a padronização dos dados vindos de diferentes APIs:

const books = data.items.map(item => ({
 title: item.volumeInfo.title || 'Título desconhecido',
 authors: item.volumeInfo.authors || ['Autor desconhecido'],
 ...
}));
Outro algoritmo importante é a ordenação local de resultados:
if (sort === 'title') {
 books.sort((a, b) => a.title.localeCompare(b.title));
}

## 6. Conclusão

O desenvolvimento da aplicação "Buscador de Livros" representa uma 
iniciativa bem-sucedida de integração entre tecnologias modernas de front-end e 
serviços externos via APIs REST. A experiência proporcionada ao usuário demonstra 
como uma interface bem projetada, aliada às possibilidades da Web moderna, pode 
transformar a interação com conteúdo digital de forma significativa.

A aplicação é um exemplo concreto da aplicação prática de conceitos 
fundamentais de Engenharia de Software, como modularidade, reuso de código, 
separação de responsabilidades, tratamento de erros e responsividade. Além disso, 
ao explorar integrações com APIs como Google Books, Open Library e a IA do Google 
Gemini, o projeto mostra-se preparado para evoluções futuras, como recomendações 
personalizadas e análises semânticas mais profundas dos dados literários.

Do ponto de vista educacional, este projeto também reforça a importância da 
compreensão de estruturas de dados e algoritmos na construção de experiências 
digitais robustas. A forma com que os dados são coletados, transformados, 
ordenados e exibidos depende diretamente de técnicas de programação 
fundamentais.

Em suma, o "Buscador de Livros" é mais do que uma aplicação funcional: é 
uma vitrine das potencialidades do desenvolvimento web atual, um exemplo didático 
de integração com APIs e uma base sólida para a expansão de sistemas interativos 
no domínio da educação, cultura e tecnologia.
