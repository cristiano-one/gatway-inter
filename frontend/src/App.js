import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { 
  Settings, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configuração do Inter
const ConfigPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const navigate = useNavigate();

  const toggleSecret = (field) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const loadConfig = async () => {
    try {
      const response = await axios.get(`${API}/config/inter`);
      reset(response.data);
      toast.success("Configuração carregada!");
    } catch (error) {
      console.log("Nenhuma configuração encontrada");
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axios.post(`${API}/config/inter`, data);
      toast.success("Configuração salva com sucesso!");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast.error("Erro ao salvar configuração: " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="mr-3 h-6 w-6 text-orange-500" />
              Configuração Banco Inter
            </h1>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              ← Voltar ao Dashboard
            </Link>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Credenciais do Banco Inter</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Insira suas credenciais do Banco Inter PIX. Essas informações são necessárias para gerar cobranças PIX.
                  As credenciais são salvas de forma segura e criptografada.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ambiente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambiente
              </label>
              <select
                {...register("environment", { required: "Campo obrigatório" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="sandbox">Sandbox (Testes)</option>
                <option value="production">Produção</option>
              </select>
              {errors.environment && (
                <p className="text-red-500 text-sm mt-1">{errors.environment.message}</p>
              )}
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <div className="relative">
                <input
                  type={showSecrets.client_id ? "text" : "password"}
                  {...register("client_id", { required: "Campo obrigatório" })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Seu Client ID do Inter"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('client_id')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.client_id ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.client_id && (
                <p className="text-red-500 text-sm mt-1">{errors.client_id.message}</p>
              )}
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <div className="relative">
                <input
                  type={showSecrets.client_secret ? "text" : "password"}
                  {...register("client_secret", { required: "Campo obrigatório" })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Seu Client Secret do Inter"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('client_secret')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets.client_secret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.client_secret && (
                <p className="text-red-500 text-sm mt-1">{errors.client_secret.message}</p>
              )}
            </div>

            {/* Conta Corrente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta Corrente
              </label>
              <input
                type="text"
                {...register("conta_corrente", { required: "Campo obrigatório" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: 12345678"
              />
              {errors.conta_corrente && (
                <p className="text-red-500 text-sm mt-1">{errors.conta_corrente.message}</p>
              )}
            </div>

            {/* Chave PIX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX
              </label>
              <input
                type="text"
                {...register("pix_key", { required: "Campo obrigatório" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Sua chave PIX (CPF, e-mail, telefone ou chave aleatória)"
              />
              {errors.pix_key && (
                <p className="text-red-500 text-sm mt-1">{errors.pix_key.message}</p>
              )}
            </div>

            {/* Certificado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caminho do Certificado (.crt)
              </label>
              <input
                type="text"
                {...register("certificate_path", { required: "Campo obrigatório" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="/caminho/para/certificado.crt"
              />
              {errors.certificate_path && (
                <p className="text-red-500 text-sm mt-1">{errors.certificate_path.message}</p>
              )}
            </div>

            {/* Chave Privada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caminho da Chave Privada (.key)
              </label>
              <input
                type="text"
                {...register("private_key_path", { required: "Campo obrigatório" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="/caminho/para/chave_privada.key"
              />
              {errors.private_key_path && (
                <p className="text-red-500 text-sm mt-1">{errors.private_key_path.message}</p>
              )}
            </div>

            {/* Nome do Comerciante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Comerciante
              </label>
              <input
                type="text"
                {...register("merchant_name", { required: "Campo obrigatório", maxLength: { value: 25, message: "Máximo 25 caracteres" } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Nome da sua empresa (máx. 25 caracteres)"
              />
              {errors.merchant_name && (
                <p className="text-red-500 text-sm mt-1">{errors.merchant_name.message}</p>
              )}
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                {...register("merchant_city", { required: "Campo obrigatório", maxLength: { value: 15, message: "Máximo 15 caracteres" } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Cidade da empresa (máx. 15 caracteres)"
              />
              {errors.merchant_city && (
                <p className="text-red-500 text-sm mt-1">{errors.merchant_city.message}</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Settings className="h-5 w-5 mr-2" />
                )}
                {loading ? "Salvando..." : "Salvar Configuração"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente de Pagamento PIX
const PaymentPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [pixCharge, setPixCharge] = useState(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/pix/charge`, data);
      setPixCharge(response.data);
      toast.success("Cobrança PIX criada com sucesso!");
      reset();
    } catch (error) {
      toast.error("Erro ao criar cobrança PIX: " + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const copyPixCode = () => {
    if (pixCharge?.pix_code) {
      navigator.clipboard.writeText(pixCharge.pix_code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (pixCharge?.qr_code_base64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${pixCharge.qr_code_base64}`;
      link.download = `qrcode-${pixCharge.txid}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCard className="mr-3 h-6 w-6 text-blue-500" />
              Criar Cobrança PIX
            </h1>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              ← Voltar ao Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register("amount", { 
                      required: "Campo obrigatório",
                      min: { value: 0.01, message: "Valor mínimo R$ 0,01" }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    {...register("description", { required: "Campo obrigatório" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição do pagamento"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Pagador (Opcional)
                  </label>
                  <input
                    type="text"
                    {...register("payer_name")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF do Pagador (Opcional)
                  </label>
                  <input
                    type="text"
                    {...register("payer_cpf")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail do Pagador (Opcional)
                  </label>
                  <input
                    type="email"
                    {...register("payer_email")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade (horas)
                  </label>
                  <select
                    {...register("due_hours")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 hora</option>
                    <option value="6">6 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas</option>
                    <option value="48">48 horas</option>
                    <option value="72">72 horas</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <QrCode className="h-5 w-5 mr-2" />
                  )}
                  {loading ? "Gerando..." : "Gerar PIX"}
                </button>
              </form>
            </div>

            {/* Resultado */}
            {pixCharge && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Cobrança PIX Criada
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      ID da Transação
                    </label>
                    <p className="text-sm font-mono bg-white p-2 rounded border">
                      {pixCharge.txid}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Valor
                    </label>
                    <p className="text-lg font-semibold text-green-600">
                      R$ {pixCharge.amount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </span>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      QR Code PIX
                    </label>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img 
                        src={`data:image/png;base64,${pixCharge.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <button
                      onClick={downloadQRCode}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar QR Code
                    </button>
                  </div>

                  {/* PIX Code */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Código PIX Copia e Cola
                    </label>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs font-mono break-all text-gray-700 mb-2">
                        {pixCharge.pix_code}
                      </p>
                      <button
                        onClick={copyPixCode}
                        className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 flex items-center justify-center"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copied ? "Copiado!" : "Copiar Código PIX"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = () => {
  const [charges, setCharges] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);

  const loadCharges = async () => {
    try {
      const response = await axios.get(`${API}/pix/charges`);
      setCharges(response.data);
      
      // Calcular estatísticas
      const total = response.data.length;
      const pending = response.data.filter(c => c.status === 'pending').length;
      const confirmed = response.data.filter(c => c.status === 'confirmed').length;
      
      setStats({ total, pending, confirmed });
    } catch (error) {
      console.error("Erro ao carregar cobranças:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCharges();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PIX Inter Gateway</h1>
              <p className="text-gray-600 mt-1">Gateway de pagamento PIX para integração com Odoo 14</p>
            </div>
            <div className="flex gap-3">
              <Link 
                to="/config" 
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Link>
              <Link 
                to="/payment" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Nova Cobrança
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Cobranças</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmadas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.confirmed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Cobranças */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cobranças Recentes</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Carregando cobranças...</p>
            </div>
          ) : charges.length === 0 ? (
            <div className="p-6 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Nenhuma cobrança encontrada</p>
              <Link 
                to="/payment" 
                className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
              >
                Criar primeira cobrança →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {charges.map((charge) => (
                    <tr key={charge.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{charge.txid}</div>
                        {charge.payer_name && (
                          <div className="text-xs text-gray-500">{charge.payer_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          R$ {charge.amount.toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {charge.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(charge.status)}
                          <span className="ml-2 text-sm text-gray-900">
                            {getStatusText(charge.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(charge.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Documentação da API */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integração com Odoo 14</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Endpoints para Odoo:</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">POST</span>
                <span className="text-gray-700">/api/odoo/order</span>
              </div>
              <div className="flex">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">GET</span>
                <span className="text-gray-700">/api/odoo/payment/{'{'} order_id {'}'}</span>
              </div>
              <div className="flex">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">POST</span>
                <span className="text-gray-700">/api/pix/webhook</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Use estes endpoints para integrar o gateway PIX com seu Odoo 14. 
              Documentação completa disponível em: <strong>{BACKEND_URL}/docs</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;