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
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: data.password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al registrarse')
      toast('¡Cuenta creada! Bienvenido al prode 🏆', 'gold')
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
      <h2 className="text-xl font-bold text-white mb-6">Crear cuenta</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nombre de usuario"
          placeholder="tu_usuario"
          hint="Solo letras, números y guiones bajos"
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
        <Input
          type="password"
          label="Confirmar contraseña"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={loading} className="w-full mt-2">
          Crear cuenta
        </Button>
      </form>
      <p className="text-center text-dark-400 text-sm mt-4">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-gold-400 hover:text-gold-300">
          Iniciá sesión
        </Link>
      </p>
    </Card>
  )
}
