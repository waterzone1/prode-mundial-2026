'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'

const schema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(20),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al iniciar sesión')
      toast('¡Bienvenido de vuelta! 🎉', 'success')
      router.push('/')
      router.refresh()
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Iniciar sesión</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nombre de usuario"
          placeholder="tu_usuario"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={loading} className="w-full mt-2">
          Ingresar
        </Button>
      </form>
      <p className="text-center text-dark-400 text-sm mt-4">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="text-gold-400 hover:text-gold-300">
          Registrate
        </Link>
      </p>
    </Card>
  )
}
