export interface InvoiceItemDto {
  produto_id: string;
  quantidade: number;
}

export interface InvoiceDto {
  id: string;
  numeracao_sequencial: number;
  status: 'ABERTA' | 'FECHADA';
  itens: InvoiceItemDto[];
  criado_em: string;
  atualizado_em: string;
}
