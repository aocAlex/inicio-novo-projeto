
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PetitionTemplate } from '@/types/petition'
import { Play, Download, Send } from 'lucide-react'

interface AdvancedTemplateExecutorProps {
  isOpen: boolean
  template: PetitionTemplate
  onClose: () => void
  onSuccess: () => void
}

export const AdvancedTemplateExecutor = ({ 
  isOpen,
  template, 
  onClose,
  onSuccess
}: AdvancedTemplateExecutorProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [generatedContent, setGeneratedContent] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsExecuting(true)
    
    try {
      // Gerar conteúdo com base no template
      let content = template.template_content
      
      // Substituir variáveis no template
      Object.entries(formData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        content = content.replace(regex, String(value || ''))
      })
      
      setGeneratedContent(content)
      
      // Simular execução (aqui você pode adicionar lógica real de execução)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess()
    } catch (error) {
      console.error('Error executing template:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      civil: 'bg-blue-100 text-blue-800',
      criminal: 'bg-red-100 text-red-800',
      trabalhista: 'bg-green-100 text-green-800',
      tributario: 'bg-yellow-100 text-yellow-800',
      empresarial: 'bg-purple-100 text-purple-800',
      familia: 'bg-pink-100 text-pink-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Executar Template: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Template */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  {template.description && (
                    <p className="text-gray-600 mt-1">{template.description}</p>
                  )}
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Preenchimento */}
            <Card>
              <CardHeader>
                <CardTitle>Preencher Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campos básicos padrão */}
                  <div className="space-y-2">
                    <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                    <Input
                      id="cliente_nome"
                      value={formData.cliente_nome || ''}
                      onChange={(e) => handleInputChange('cliente_nome', e.target.value)}
                      placeholder="Digite o nome do cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processo_numero">Número do Processo</Label>
                    <Input
                      id="processo_numero"
                      value={formData.processo_numero || ''}
                      onChange={(e) => handleInputChange('processo_numero', e.target.value)}
                      placeholder="0000000-00.0000.0.00.0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor_causa">Valor da Causa</Label>
                    <Input
                      id="valor_causa"
                      value={formData.valor_causa || ''}
                      onChange={(e) => handleInputChange('valor_causa', e.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_hoje">Data de Hoje</Label>
                    <Input
                      id="data_hoje"
                      type="date"
                      value={formData.data_hoje || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleInputChange('data_hoje', e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isExecuting}
                  >
                    {isExecuting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Executando...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Executar Template
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Preview do Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle>Preview da Petição</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    <Textarea
                      value={generatedContent}
                      readOnly
                      rows={15}
                      className="font-mono text-sm"
                    />
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                      </Button>
                      {template.webhook_enabled && (
                        <Button variant="outline" size="sm">
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Webhook
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Preencha os campos ao lado para visualizar o preview da petição</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
