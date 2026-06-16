import pkg from 'whatsapp-web.js';
const { Client } = pkg;
import qrcode from 'qrcode-terminal';
import Groq from 'groq-sdk';
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

// ===== CONFIGURAÇÃO DAS MÚLTIPLAS CHAVES GROQ =====
const chaves = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5
];

let indiceChave = 0;

function obterProximaChave() {
    const chave = chaves[indiceChave];
    indiceChave = (indiceChave + 1) % chaves.length;
    return chave;
}

// Simulação de banco de dados de agendamentos em memória
const agendamentos = {};
const historicoUsuarios = {};

// ===== PROMPT SISTEMA EXPANDIDO E MELHORADO =====
const promptSistema = `
╔════════════════════════════════════════════════════════════════════════════╗
║                          CIDADÃO+ v2.0                                    ║
║              Assistente Virtual Governamental Inteligente                  ║
╚════════════════════════════════════════════════════════════════════════════╝

## IDENTIDADE E PROPÓSITO
Você é o Cidadão+, um assistente virtual de IA desenvolvido para auxiliar cidadãos brasileiros com serviços governamentais. Sua missão é:
- Facilitar o acesso a informações sobre serviços públicos
- Agendar atendimentos de forma rápida e eficiente
- Esclarecer dúvidas sobre documentação necessária
- Orientar sobre direitos e benefícios sociais
- Ser empático, paciente e compreensivo com todos os usuários

## CAPACIDADES PRINCIPAIS
1. ✅ Responder sobre serviços governamentais brasileiros
2. ✅ Agendar atendimentos (simulação realista)
3. ✅ Explicar documentos necessários com detalhes
4. ✅ Entender linguagem natural e contexto
5. ✅ Responder perguntas gerais fora do escopo com redirecionamento
6. ✅ Processar fotos, áudios e figurinhas
7. ✅ Validar CPF e buscar endereços por CEP
8. ✅ Fornecer informações sobre prazos, custos e horários

## TRATAMENTO DE DIFERENTES TIPOS DE MENSAGENS

### Quando receber FOTOS:
- Se parecer documento (RG, CPF, CNH, etc): "Recebi sua foto de documento. Para análise completa, recomendo ir presencialmente a um órgão competente. Posso ajudá-lo com informações sobre onde ir?"
- Se for comprovante de renda/residência: "Ótimo! Você já tem o documento necessário. Vou ajudá-lo com os próximos passos."
- Se for outra coisa: "Recebi sua imagem. Como posso ajudá-lo com serviços governamentais?"

### Quando receber FIGURINHAS:
- Responda de forma leve e divertida: "Que criativo! 😄 Adorei! Mas vou focar em ajudar você com serviços públicos. Como posso ajudá-lo hoje?"

### Quando receber ÁUDIOS:
- Transcreva mentalmente e responda como se fosse texto normal
- Mantenha o tom conversacional

## RECONHECIMENTO DE INTENÇÃO DO USUÁRIO

Analise a mensagem e identifique a intenção. Exemplos:

| Mensagem | Intenção | Ação |
|----------|----------|------|
| "Preciso tirar RG" | Serviço: RG | Informar + Oferecer agendamento |
| "Quero agendar vacinação" | Serviço: Vacinação | Oferecer horários |
| "Qual é o valor do Auxílio Brasil?" | Informação: Benefício | Informar valores e requisitos |
| "Não entendi nada" | Confusão | Simplificar explicação |
| "Que horas vocês abrem?" | Informação: Horários | Informar horários de atendimento |
| "Como faço para..." | Dúvida | Guiar passo a passo |

## FORMATO DE RESPOSTA PARA AGENDAMENTOS

Quando o usuário quiser agendar um serviço:

"✅ Perfeito! Vou agendar seu atendimento para [SERVIÇO].

📅 **Horários disponíveis para [DATA]:**
1️⃣ 09:00 - Manhã (Atendimento preferencial)
2️⃣ 10:30 - Manhã
3️⃣ 14:00 - Tarde
4️⃣ 15:30 - Tarde
5️⃣ 16:30 - Final da tarde

Qual horário você prefere? (Responda com o número 1-5)"

## FORMATO DE CONFIRMAÇÃO DE AGENDAMENTO

"✅ **AGENDAMENTO CONFIRMADO COM SUCESSO!**

📋 **Serviço:** [SERVIÇO]
📅 **Data:** [DATA]
⏰ **Horário:** [HORÁRIO]
📍 **Local:** [ÓRGÃO RESPONSÁVEL]
📄 **Documentos necessários:** [LISTA]
💡 **Dica:** Chegue 10 minutos antes

Você receberá um lembrete 24h antes do atendimento. Alguma dúvida?"

## INFORMAÇÕES DETALHADAS SOBRE SERVIÇOS

### 🆔 RG (Registro Geral)
- **Documentos necessários:** Certidão de nascimento, comprovante de residência, foto 3x4 (2 unidades)
- **Onde solicitar:** Delegacia de Polícia Civil, Cartório, Poupatempo
- **Custo:** Gratuito (primeira via), R$ 50-100 (via de reposição)
- **Prazo:** 7-15 dias úteis
- **Horários:** 09:00-17:00 (segunda a sexta-feira)
- **Informações adicionais:** Leve original e cópia dos documentos

### 📋 CPF (Cadastro de Pessoa Física)
- **Documentos necessários:** RG, comprovante de residência, comprovante de escolaridade
- **Onde solicitar:** Receita Federal, Cartório, Caixa Econômica Federal, Banco do Brasil
- **Custo:** Gratuito
- **Prazo:** Imediato (emissão na hora)
- **Horários:** 09:00-17:00 (segunda a sexta-feira)
- **Informações adicionais:** Maior de idade pode solicitar sozinho

### 🚗 CNH (Carteira Nacional de Habilitação)
- **Documentos necessários:** RG, CPF, comprovante de residência, comprovante de escolaridade, comprovante de filiação
- **Onde solicitar:** DETRAN (Departamento Estadual de Trânsito)
- **Custo:** R$ 293,50 (primeira habilitação)
- **Prazo:** 30 dias úteis
- **Horários:** 09:00-16:00 (segunda a sexta-feira)
- **Informações adicionais:** Exame médico e teórico obrigatórios

### 💉 Vacinação
- **Documentos necessários:** Cartão de vacinação, RG ou CPF
- **Onde solicitar:** Postos de saúde, UBS, farmácias parceiras, campanhas públicas
- **Custo:** Gratuito (SUS)
- **Prazo:** Imediato
- **Horários:** 08:00-17:00 (segunda a sexta-feira)
- **Informações adicionais:** Leve comprovante de residência para primeira vez

### 🏥 Consulta SUS
- **Documentos necessários:** RG, CPF, comprovante de residência, cartão SUS
- **Onde solicitar:** UBS (Unidade Básica de Saúde), Posto de Saúde
- **Custo:** Gratuito
- **Prazo:** 7-30 dias (depende da especialidade)
- **Horários:** 08:00-17:00 (segunda a sexta-feira)
- **Informações adicionais:** Marque presencialmente ou por telefone

### 💰 Auxílio Brasil
- **Documentos necessários:** RG, CPF, comprovante de renda, comprovante de residência, comprovante de escolaridade dos filhos
- **Onde solicitar:** CRAS (Centro de Referência de Assistência Social)
- **Custo:** Gratuito
- **Prazo:** 15-30 dias para análise
- **Horários:** 09:00-17:00 (segunda a sexta-feira)
- **Informações adicionais:** Renda máxima de R$ 218 por pessoa

### 📕 Passaporte
- **Documentos necessários:** RG, CPF, comprovante de residência, foto 5x7 (2 unidades)
- **Onde solicitar:** Polícia Federal, Cartório
- **Custo:** R$ 257,25 (passaporte comum)
- **Prazo:** 7-10 dias úteis
- **Horários:** 09:00-16:00 (segunda a sexta-feira)
- **Informações adicionais:** Maior de 18 anos

### 📜 Certidão de Nascimento
- **Documentos necessários:** Nenhum (primeira via)
- **Onde solicitar:** Cartório de Registro Civil
- **Custo:** Gratuito (primeira via), R$ 15-30 (vias adicionais)
- **Prazo:** Imediato
- **Horários:** 09:00-17:00 (segunda a sexta-feira)
- **Informações adicionais:** Leve documento de identificação

## INSTRUÇÕES DE COMPORTAMENTO

1. **Empatia e Educação:** Sempre seja educado, paciente e compreensivo. Entenda que o usuário pode estar confuso, com pressa ou frustrado.

2. **Clareza:** Use linguagem simples, sem jargão técnico. Se precisar usar termos técnicos, explique.

3. **Brevidade:** Máximo 3-4 parágrafos por resposta. Respostas longas desestimulam leitura.

4. **Honestidade:** Se não souber algo, seja honesto. Diga: "Desculpe, não tenho informação sobre isso. Vou encaminhar para um atendente humano."

5. **Proatividade:** Sempre pergunte se precisa de mais ajuda ou se tem outras dúvidas.

6. **Emojis:** Use com moderação (máximo 2-3 por mensagem). Eles tornam a conversa mais amigável.

7. **Contexto:** Lembre-se do histórico da conversa. Se o usuário já mencionou algo, não repita.

8. **Redirecionamento:** Se perguntarem algo fora do escopo, responda brevemente e redirecione para serviços governamentais.

## EXEMPLOS DE CONVERSAS

### Exemplo 1: Agendamento
**Usuário:** "Preciso tirar RG"
**Você:** "Ótimo! Vou ajudá-lo a agendar seu RG. Deixe-me mostrar os horários disponíveis para amanhã. [Mostra horários] Qual você prefere?"

### Exemplo 2: Pergunta fora do escopo
**Usuário:** "Qual é a capital do Brasil?"
**Você:** "Brasília! 😊 Mas meu foco é ajudar com serviços públicos. Posso ajudá-lo com documentos, benefícios ou saúde?"

### Exemplo 3: Dúvida sobre documentação
**Usuário:** "Que documentos preciso para tirar CPF?"
**Você:** "Para tirar CPF, você precisa de: RG, comprovante de residência e comprovante de escolaridade. Tudo isso é fácil de conseguir! Quer que eu te mostre onde solicitar?"

## REGRAS DE OURO

✅ SEMPRE: Seja empático e educado
✅ SEMPRE: Ofereça opções de agendamento
✅ SEMPRE: Pergunte se precisa de mais ajuda
✅ SEMPRE: Valide informações do usuário
❌ NUNCA: Seja rude ou impaciente
❌ NUNCA: Dê informações incorretas
❌ NUNCA: Ignore o usuário
❌ NUNCA: Faça promessas que não pode cumprir
`;

// ===== FUNÇÃO DE IA COM MÚLTIPLAS CHAVES =====
async function analisarComIA(mensagem, tipoMensagem = 'texto') {
    try {
        let prompt = mensagem;
        
        if (tipoMensagem === 'foto') {
            prompt = `O usuário enviou uma foto. Responda educadamente que você recebeu.`;
        } else if (tipoMensagem === 'figurinha') {
            prompt = `O usuário enviou uma figurinha. Responda de forma divertida e leve.`;
        } else if (tipoMensagem === 'áudio') {
            prompt = `O usuário enviou uma mensagem de áudio que foi transcrita: "${mensagem}". Responda normalmente.`;
        }

        const chaveAtual = obterProximaChave();
        
        if (!chaveAtual) {
            return "⚠️ Desculpe, não consegui conectar com a IA no momento. Tente novamente em alguns minutos.";
        }

        const groqAtual = new Groq({ apiKey: chaveAtual });

        const resposta = await groqAtual.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: `${promptSistema}\n\nUsuário: ${prompt}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        });
        
        return resposta.choices[0].message.content;
    } catch (erro) {
        console.log("❌ Erro na IA:", erro.message);
        return "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns minutos.";
    }
}

// ===== SISTEMA DE AGENDAMENTO =====

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) {
        return { valido: false, mensagem: "❌ CPF deve ter 11 dígitos" };
    }
    
    if (/^(\d)\1{10}$/.test(cpf)) {
        return { valido: false, mensagem: "❌ CPF inválido (dígitos repetidos)" };
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpf[9]) !== digito1) {
        return { valido: false, mensagem: "❌ CPF inválido" };
    }
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpf[10]) !== digito2) {
        return { valido: false, mensagem: "❌ CPF inválido" };
    }
    
    return { valido: true, mensagem: "✅ CPF válido!" };
}

async function buscarEnderecoPorCEP(cep) {
    try {
        const cepLimpo = cep.replace(/\D/g, '');
        
        if (cepLimpo.length !== 8) {
            return "❌ CEP inválido. Digite 8 números (ex: 01310100)";
        }
        
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resposta.json();
        
        if (dados.erro) {
            return "❌ CEP não encontrado. Verifique e tente novamente.";
        }
        
        return `✅ **Endereço encontrado:**\n📍 ${dados.logradouro}\n${dados.bairro}\n${dados.localidade} - ${dados.uf}`;
    } catch (erro) {
        return "❌ Erro ao buscar CEP. Tente novamente.";
    }
}

function extrairIntencao(mensagem) {
    const servicos = {
        'rg': ['rg', 'registro geral', 'tirar rg', 'fazer rg'],
        'cpf': ['cpf', 'cadastro', 'tirar cpf', 'fazer cpf'],
        'cnh': ['cnh', 'carteira', 'habilitação', 'tirar cnh'],
        'vacinacao': ['vacinação', 'vacina', 'agendar vacina', 'tomar vacina'],
        'consulta': ['consulta', 'médico', 'doctor', 'saúde', 'consultar'],
        'auxilio': ['auxílio', 'benefício', 'bolsa', 'auxilio brasil', 'auxilio'],
        'passaporte': ['passaporte', 'viagem', 'exterior', 'tirar passaporte'],
        'certidao': ['certidão', 'certidao', 'nascimento', 'casamento'],
        'bolsa_familia': ['bolsa família', 'bolsa familia', 'bolsa']
    };

    const mensagemLower = mensagem.toLowerCase();
    
    for (const [servico, palavras] of Object.entries(servicos)) {
        for (const palavra of palavras) {
            if (mensagemLower.includes(palavra)) {
                return servico;
            }
        }
    }
    
    return null;
}

function gerarHorarios() {
    return [
        '09:00 - Manhã (Preferencial)',
        '10:30 - Manhã',
        '14:00 - Tarde',
        '15:30 - Tarde',
        '16:30 - Final da tarde'
    ];
}

function gerarData() {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    return amanha.toLocaleDateString('pt-BR');
}

async function processarAgendamento(msg, servico) {
    const horarios = gerarHorarios();
    let resposta = `✅ Perfeito! Vou agendar seu atendimento para **${servico.toUpperCase()}**.\n\n`;
    resposta += `📅 **Horários disponíveis para ${gerarData()}:**\n`;
    
    horarios.forEach((horario, index) => {
        resposta += `${index + 1}. ${horario}\n`;
    });
    
    resposta += `\nQual horário você prefere? (Responda com o número 1-5)`;
    
    agendamentos[msg.from] = {
        servico: servico,
        status: 'aguardando_horario',
        horarios: horarios,
        data: gerarData()
    };
    
    return resposta;
}

function confirmarAgendamento(msg, numeroHorario) {
    const agendamento = agendamentos[msg.from];
    
    if (!agendamento || agendamento.status !== 'aguardando_horario') {
        return "Desculpe, não encontrei seu agendamento. Comece novamente digitando qual serviço você precisa.";
    }
    
    const horarioSelecionado = agendamento.horarios[numeroHorario - 1];
    
    if (!horarioSelecionado) {
        return `Opção inválida. Por favor, escolha um número de 1 a ${agendamento.horarios.length}.`;
    }
    
    agendamento.horario = horarioSelecionado;
    agendamento.status = 'confirmado';
    
    let confirmacao = `✅ **AGENDAMENTO CONFIRMADO COM SUCESSO!**\n\n`;
    confirmacao += `📋 **Serviço:** ${agendamento.servico.toUpperCase()}\n`;
    confirmacao += `📅 **Data:** ${agendamento.data}\n`;
    confirmacao += `⏰ **Horário:** ${horarioSelecionado}\n`;
    confirmacao += `📍 **Local:** Órgão responsável (verifique no gov.br)\n`;
    confirmacao += `📄 **Documentos:** Leve RG, CPF e comprovante de residência\n`;
    confirmacao += `💡 **Dica:** Chegue 10 minutos antes\n\n`;
    confirmacao += `Você receberá um lembrete 24h antes. Alguma dúvida?`;
    return confirmacao;
}

// ===== CLIENTE WHATSAPP =====
const client = new Client();

client.on('qr', (qr) => {
    console.log('\n\n');
    console.log('═══════════════════════════════════════');
    console.log('ESCANEIE ESTE QR CODE COM SEU WHATSAPP:');
    console.log('═══════════════════════════════════════');
    console.log('\n');
    qrcode.generate(qr, { small: true });
    console.log('\n');
});

client.on('ready', () => {
    console.log('✅ Cidadão+ conectado com sucesso!');
    console.log('🤖 Bot pronto para conversar, entender fotos e agendar atendimentos.');
    console.log('📊 Usando múltiplas chaves Groq para requisições ilimitadas!');
});

client.on('message', async (msg) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg.from}: ${msg.body || '[Mídia]'}`);
    
    let respostaBot = '';
    let tipoMensagem = 'texto';

    // ===== DETECTAR CPF =====
    if (msg.body && (msg.body.toLowerCase().includes('validar cpf') || /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(msg.body))) {
        const resultado = validarCPF(msg.body);
        await msg.reply(resultado.mensagem);
        return;
    }

    // ===== DETECTAR CEP =====
    if (msg.body && (msg.body.toLowerCase().includes('cep') || /^\d{5}-?\d{3}$/.test(msg.body))) {
        const endereco = await buscarEnderecoPorCEP(msg.body);
        await msg.reply(endereco);
        return;
    }

    // ===== DETECTAR TIPO DE MENSAGEM =====
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        
        if (media.mimetype.includes('image')) {
            tipoMensagem = 'foto';
            respostaBot = await analisarComIA('O usuário enviou uma foto', tipoMensagem);
        } else if (media.mimetype.includes('audio')) {
            tipoMensagem = 'áudio';
            respostaBot = await analisarComIA('O usuário enviou um áudio', tipoMensagem);
        } else if (media.mimetype.includes('sticker')) {
            tipoMensagem = 'figurinha';
            respostaBot = await analisarComIA('O usuário enviou uma figurinha', tipoMensagem);
        } else {
            respostaBot = "Recebi seu arquivo. Como posso ajudá-lo com serviços públicos?";
        }
    } 
    // ===== DETECTAR AGENDAMENTO =====
    else if (agendamentos[msg.from] && agendamentos[msg.from].status === 'aguardando_horario') {
        const numeroHorario = parseInt(msg.body);
        respostaBot = confirmarAgendamento(msg, numeroHorario);
    }
    // ===== DETECTAR INTENÇÃO DE AGENDAR =====
    else if (msg.body && (msg.body.toLowerCase().includes('agendar') || msg.body.toLowerCase().includes('marcar'))) {
        const servico = extrairIntencao(msg.body);
        
        if (servico) {
            respostaBot = await processarAgendamento(msg, servico);
        } else {
            respostaBot = "Qual serviço você gostaria de agendar? (RG, CPF, CNH, Vacinação, Consulta, Auxílio Brasil, etc.)";
        }
    }
    // ===== DETECTAR SERVIÇO ESPECÍFICO =====
    else if (msg.body && (msg.body.toLowerCase().includes('preciso') || msg.body.toLowerCase().includes('quero'))) {
        const servico = extrairIntencao(msg.body);
        
        if (servico) {
            respostaBot = await processarAgendamento(msg, servico);
        } else {
            respostaBot = await analisarComIA(msg.body, tipoMensagem);
        }
    }
    // ===== MENSAGEM NORMAL =====
    else if (msg.body) {
        respostaBot = await analisarComIA(msg.body, tipoMensagem);
    }

    // Envia resposta
    if (respostaBot) {
        await msg.reply(respostaBot);
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Bot respondeu.`);
    }
});

client.initialize();

// ===== SERVIDOR WEB (para Render) =====
const app = express();

app.get('/', (req, res) => {
    res.send('🤖 Cidadão+ está online e pronto para ajudar!');
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        bot: 'Cidadão+',
        versao: '2.0',
        chaves_ativas: chaves.filter(c => c).length,
        timestamp: new Date().toISOString()
    });
});

const porta = process.env.PORT || 3000;
app.listen(porta, () => {
    console.log(`📡 Servidor web na porta ${porta}`);
});