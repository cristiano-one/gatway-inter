from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import qrcode
from io import BytesIO
import json
import httpx
import base64
import hashlib
import hmac
from urllib.parse import quote


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="PIX Inter Gateway", description="Gateway de pagamento PIX para integração com Odoo 14")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Pydantic Models
class InterConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_secret: str
    certificate_path: str
    private_key_path: str
    conta_corrente: str
    pix_key: str
    environment: str = "sandbox"  # sandbox ou production
    merchant_name: str
    merchant_city: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InterConfigCreate(BaseModel):
    client_id: str
    client_secret: str
    certificate_path: str
    private_key_path: str
    conta_corrente: str
    pix_key: str
    environment: str = "sandbox"
    merchant_name: str
    merchant_city: str

class PixCharge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    txid: str
    amount: float
    description: str
    payer_name: Optional[str] = None
    payer_cpf: Optional[str] = None
    payer_email: Optional[str] = None
    status: str = "pending"  # pending, confirmed, cancelled, expired
    pix_code: Optional[str] = None
    qr_code_base64: Optional[str] = None
    due_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    odoo_order_id: Optional[str] = None
    webhook_url: Optional[str] = None

class PixChargeCreate(BaseModel):
    amount: float
    description: str
    payer_name: Optional[str] = None
    payer_cpf: Optional[str] = None
    payer_email: Optional[str] = None
    due_hours: int = 24  # Validade em horas
    webhook_url: Optional[str] = None
    odoo_order_id: Optional[str] = None

class PixWebhook(BaseModel):
    txid: str
    status: str
    payment_date: Optional[datetime] = None
    amount_paid: Optional[float] = None

class OdooOrder(BaseModel):
    order_id: str
    customer_name: str
    total_amount: float
    description: str
    webhook_url: Optional[str] = None

# Inter PIX Service
class InterPixService:
    def __init__(self, config: InterConfig):
        self.config = config
        self.base_url = "https://cdpj.partners.bancointer.com.br" if config.environment == "production" else "https://cdpj-sandbox.partners.bancointer.com.br"
        
    async def get_access_token(self):
        """Simula obtenção de token - você implementará com suas credenciais"""
        # Esta é uma implementação simulada
        # Na implementação real, você usará o certificado e chave privada
        return "fake_access_token_for_demo"
    
    def generate_pix_brcode(self, txid: str, amount: float, description: str) -> str:
        """Gera BRCode PIX simples para demonstração"""
        # Esta é uma implementação simulada do BRCode
        # Na implementação real, você usará a API do Inter
        
        # Componentes básicos do BRCode
        payload_format = "000201"
        point_of_initiation = "010212"
        
        # Chave PIX (26 = tamanho fixo para chave)
        pix_key = self.config.pix_key
        pix_key_length = f"{len(pix_key):02d}"
        merchant_account_info = f"26{pix_key_length}{pix_key}"
        
        # Categoria de comerciante
        merchant_category = "52040000"
        
        # Moeda (986 = BRL)
        currency = "5303986"
        
        # Valor
        amount_str = f"{amount:.2f}"
        amount_length = f"{len(amount_str):02d}"
        transaction_amount = f"54{amount_length}{amount_str}"
        
        # País
        country_code = "5802BR"
        
        # Nome do estabelecimento
        merchant_name = self.config.merchant_name[:25]  # Max 25 chars
        merchant_name_length = f"{len(merchant_name):02d}"
        merchant_name_field = f"59{merchant_name_length}{merchant_name}"
        
        # Cidade
        merchant_city = self.config.merchant_city[:15]  # Max 15 chars
        merchant_city_length = f"{len(merchant_city):02d}"
        merchant_city_field = f"60{merchant_city_length}{merchant_city}"
        
        # Informações adicionais
        additional_info = description[:99]  # Max 99 chars
        additional_info_length = f"{len(additional_info):02d}"
        additional_data = f"62{additional_info_length}{additional_info}"
        
        # Monta payload sem CRC
        payload_without_crc = (
            payload_format +
            point_of_initiation +
            merchant_account_info +
            merchant_category +
            currency +
            transaction_amount +
            country_code +
            merchant_name_field +
            merchant_city_field +
            additional_data +
            "6304"  # CRC placeholder
        )
        
        # Calcula CRC16
        crc = self.calculate_crc16(payload_without_crc[:-4])
        
        # Payload final
        return payload_without_crc[:-4] + f"6304{crc:04X}"
    
    def calculate_crc16(self, data: str) -> int:
        """Calcula CRC16 para BRCode PIX"""
        crc = 0xFFFF
        for byte in data.encode('ascii'):
            crc ^= byte << 8
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ 0x1021
                else:
                    crc <<= 1
                crc &= 0xFFFF
        return crc
    
    def generate_qr_code(self, pix_code: str) -> str:
        """Gera QR code em base64"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(pix_code)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Converte para base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return img_str
    
    async def create_charge(self, charge_data: PixChargeCreate) -> PixCharge:
        """Cria cobrança PIX"""
        txid = f"TX{uuid.uuid4().hex[:10].upper()}"
        
        # Gera BRCode
        pix_code = self.generate_pix_brcode(
            txid=txid,
            amount=charge_data.amount,
            description=charge_data.description
        )
        
        # Gera QR Code
        qr_code_base64 = self.generate_qr_code(pix_code)
        
        # Cria objeto de cobrança
        charge = PixCharge(
            txid=txid,
            amount=charge_data.amount,
            description=charge_data.description,
            payer_name=charge_data.payer_name,
            payer_cpf=charge_data.payer_cpf,
            payer_email=charge_data.payer_email,
            pix_code=pix_code,
            qr_code_base64=qr_code_base64,
            due_date=datetime.utcnow() + timedelta(hours=charge_data.due_hours),
            webhook_url=charge_data.webhook_url,
            odoo_order_id=charge_data.odoo_order_id
        )
        
        return charge
    
    async def check_payment_status(self, txid: str) -> str:
        """Verifica status do pagamento"""
        # Na implementação real, consultaria a API do Inter
        # Para demonstração, retorna status baseado em tempo
        return "pending"


# Dependency para obter configuração
async def get_inter_config() -> InterConfig:
    config_doc = await db.inter_config.find_one()
    if not config_doc:
        raise HTTPException(status_code=404, detail="Configuração do Inter não encontrada. Configure suas credenciais primeiro.")
    return InterConfig(**config_doc)


# Routes para configuração
@api_router.post("/config/inter", response_model=InterConfig)
async def save_inter_config(config: InterConfigCreate):
    """Salva configuração do Banco Inter"""
    config_dict = config.dict()
    config_obj = InterConfig(**config_dict)
    
    # Remove configuração existente
    await db.inter_config.delete_many({})
    
    # Salva nova configuração
    await db.inter_config.insert_one(config_obj.dict())
    
    return config_obj

@api_router.get("/config/inter", response_model=InterConfig)
async def get_inter_config_route():
    """Obtém configuração do Banco Inter"""
    return await get_inter_config()

@api_router.put("/config/inter", response_model=InterConfig)
async def update_inter_config(config: InterConfigCreate):
    """Atualiza configuração do Banco Inter"""
    config_dict = config.dict()
    config_dict['updated_at'] = datetime.utcnow()
    
    result = await db.inter_config.update_one(
        {},
        {"$set": config_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    updated_config = await db.inter_config.find_one()
    return InterConfig(**updated_config)


# Routes PIX
@api_router.post("/pix/charge", response_model=PixCharge)
async def create_pix_charge(charge_data: PixChargeCreate, config: InterConfig = Depends(get_inter_config)):
    """Cria nova cobrança PIX"""
    service = InterPixService(config)
    
    try:
        charge = await service.create_charge(charge_data)
        
        # Salva no banco
        await db.pix_charges.insert_one(charge.dict())
        
        return charge
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar cobrança PIX: {str(e)}")

@api_router.get("/pix/charge/{txid}", response_model=PixCharge)
async def get_pix_charge(txid: str):
    """Obtém detalhes de uma cobrança PIX"""
    charge_doc = await db.pix_charges.find_one({"txid": txid})
    if not charge_doc:
        raise HTTPException(status_code=404, detail="Cobrança não encontrada")
    
    return PixCharge(**charge_doc)

@api_router.get("/pix/charges", response_model=List[PixCharge])
async def list_pix_charges(limit: int = 50, skip: int = 0):
    """Lista cobranças PIX"""
    charges = await db.pix_charges.find().skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return [PixCharge(**charge) for charge in charges]

@api_router.post("/pix/webhook")
async def pix_webhook(webhook_data: PixWebhook):
    """Webhook para receber confirmações de pagamento"""
    txid = webhook_data.txid
    
    # Atualiza status no banco
    update_data = {
        "status": webhook_data.status,
        "updated_at": datetime.utcnow()
    }
    
    if webhook_data.payment_date:
        update_data["payment_date"] = webhook_data.payment_date
    if webhook_data.amount_paid:
        update_data["amount_paid"] = webhook_data.amount_paid
    
    result = await db.pix_charges.update_one(
        {"txid": txid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Se confirmado, notifica Odoo
    if webhook_data.status == "confirmed":
        charge_doc = await db.pix_charges.find_one({"txid": txid})
        if charge_doc and charge_doc.get("webhook_url"):
            await notify_odoo_payment(charge_doc)
    
    return {"status": "received"}

async def notify_odoo_payment(charge_data: dict):
    """Notifica Odoo sobre pagamento confirmado"""
    if not charge_data.get("webhook_url"):
        return
    
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "txid": charge_data["txid"],
                "amount": charge_data["amount"],
                "status": "confirmed",
                "payment_date": datetime.utcnow().isoformat(),
                "odoo_order_id": charge_data.get("odoo_order_id")
            }
            
            response = await client.post(
                charge_data["webhook_url"],
                json=payload,
                timeout=30
            )
            
            # Log da resposta
            logging.info(f"Odoo webhook response: {response.status_code}")
            
    except Exception as e:
        logging.error(f"Erro ao notificar Odoo: {str(e)}")


# Routes para integração com Odoo
@api_router.post("/odoo/order", response_model=dict)
async def create_order_from_odoo(order_data: OdooOrder, config: InterConfig = Depends(get_inter_config)):
    """Cria cobrança PIX a partir de pedido Odoo"""
    
    charge_data = PixChargeCreate(
        amount=order_data.total_amount,
        description=f"Pedido Odoo: {order_data.description}",
        payer_name=order_data.customer_name,
        webhook_url=order_data.webhook_url,
        odoo_order_id=order_data.order_id
    )
    
    service = InterPixService(config)
    charge = await service.create_charge(charge_data)
    
    # Salva no banco
    await db.pix_charges.insert_one(charge.dict())
    
    return {
        "txid": charge.txid,
        "pix_code": charge.pix_code,
        "qr_code_base64": charge.qr_code_base64,
        "amount": charge.amount,
        "due_date": charge.due_date.isoformat(),
        "status": charge.status
    }

@api_router.get("/odoo/payment/{order_id}")
async def get_payment_by_order_id(order_id: str):
    """Obtém status de pagamento por ID do pedido Odoo"""
    charge_doc = await db.pix_charges.find_one({"odoo_order_id": order_id})
    if not charge_doc:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado para este pedido")
    
    return {
        "order_id": order_id,
        "txid": charge_doc["txid"],
        "status": charge_doc["status"],
        "amount": charge_doc["amount"],
        "created_at": charge_doc["created_at"],
        "updated_at": charge_doc["updated_at"]
    }


# Routes básicas existentes
@api_router.get("/")
async def root():
    return {"message": "PIX Inter Gateway API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()