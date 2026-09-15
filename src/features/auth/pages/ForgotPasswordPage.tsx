import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Loader2, Stethoscope, Activity, HeartPulse, ShieldCheck, ArrowLeft, KeyRound, User, Mail, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authApi } from '../api/auth.api';

type RecoveryType = 'password' | 'username' | 'email';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [recoveryType, setRecoveryType] = useState<RecoveryType>('password');
    const [identifier, setIdentifier] = useState('');
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Security questions loaded from backend
    const [questions, setQuestions] = useState<{ question1: string; question2: string } | null>(null);

    // Answers input by user
    const [answer1, setAnswer1] = useState('');
    const [answer2, setAnswer2] = useState('');

    // Results
    const [recoveredUsername, setRecoveredUsername] = useState('');
    const [recoveredEmail, setRecoveredEmail] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchQuestions = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) {
            setError('Por favor, ingrese un identificador válido.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.getSecurityQuestions(identifier.trim());
            setQuestions({
                question1: response.data.question1,
                question2: response.data.question2,
            });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se pudieron cargar las preguntas. Verifique su identificador.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAnswers = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer1.trim() || !answer2.trim()) {
            setError('Por favor, responda ambas preguntas.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await authApi.verifySecurityAnswers({
                identifier: identifier.trim(),
                answer1: answer1.trim(),
                answer2: answer2.trim(),
                action: recoveryType,
            });

            if (recoveryType === 'password') {
                // Redirigir directamente a la página de cambio de clave con el token obtenido
                navigate(`/reset-password/${response.data.token}`);
            } else if (recoveryType === 'username') {
                setRecoveredUsername(response.data.username || '');
                setStep(3);
            } else if (recoveryType === 'email') {
                setRecoveredEmail(response.data.email || '');
                setStep(3);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Las respuestas son incorrectas. Intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetWizard = (type: RecoveryType) => {
        setRecoveryType(type);
        setIdentifier('');
        setStep(1);
        setQuestions(null);
        setAnswer1('');
        setAnswer2('');
        setRecoveredUsername('');
        setRecoveredEmail('');
        setError(null);
    };

    return (
        <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#eaebed] font-sans overflow-y-auto lg:overflow-hidden">
            {/* Left Panel: Form Wizard */}
            <div className="flex-1 flex flex-col justify-start lg:justify-center px-4 sm:px-12 lg:px-20 xl:px-24 py-6 sm:py-10 bg-[#eaebed] lg:bg-white overflow-y-auto min-h-0 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="max-w-md w-full mx-auto space-y-4 sm:space-y-6 my-auto">
                    <div className="space-y-2 sm:space-y-3 text-center lg:text-left">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al login
                        </Link>
                        {/* Stethoscope Logo (Only on Mobile/Tablet) */}
                        <div className="lg:hidden mx-auto flex p-3 sm:p-4 rounded-2xl bg-[#1a5f9c] text-white shadow-md mb-2 w-fit">
                            <Stethoscope className="h-7 w-7 sm:h-8 sm:w-8" />
                        </div>
                        <div className="hidden lg:flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-lg font-black tracking-tight text-primary">
                                Portal Clínico Hidroven-Falcón
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1c1e] lg:text-primary">
                            Recuperar Acceso
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm">
                            Utilice sus preguntas de seguridad configuradas para restablecer sus credenciales.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl border border-slate-200/80 space-y-5 sm:space-y-6">
                        {step === 1 && (
                            <Tabs value={recoveryType} onValueChange={(v) => resetWizard(v as RecoveryType)} className="w-full">
                                <TabsList className="grid grid-cols-3 mb-6 bg-slate-100 rounded-xl p-1">
                                    <TabsTrigger value="password" className="rounded-lg text-xs flex items-center gap-1.5 py-2">
                                        <KeyRound className="h-3 w-3" /> Clave
                                    </TabsTrigger>
                                    <TabsTrigger value="username" className="rounded-lg text-xs flex items-center gap-1.5 py-2">
                                        <User className="h-3 w-3" /> Usuario
                                    </TabsTrigger>
                                    <TabsTrigger value="email" className="rounded-lg text-xs flex items-center gap-1.5 py-2">
                                        <Mail className="h-3 w-3" /> Correo
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="password">
                                    <form onSubmit={handleFetchQuestions} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                Usuario o Correo Electrónico
                                            </label>
                                            <Input
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                placeholder="Ej. josequintero o jose@gmail.com"
                                                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl text-sm"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full h-12 font-bold rounded-xl mt-2" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Cargar Preguntas de Seguridad
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="username">
                                    <form onSubmit={handleFetchQuestions} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                Correo Electrónico Registrado
                                            </label>
                                            <Input
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                type="email"
                                                placeholder="doctor@ejemplo.com"
                                                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl text-sm"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full h-12 font-bold rounded-xl mt-2" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Cargar Preguntas de Seguridad
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="email">
                                    <form onSubmit={handleFetchQuestions} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                Nombre de Usuario (Username)
                                            </label>
                                            <Input
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                placeholder="Ej. josequintero"
                                                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl text-sm"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full h-12 font-bold rounded-xl mt-2" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Cargar Preguntas de Seguridad
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        )}

                        {step === 2 && questions && (
                            <form onSubmit={handleVerifyAnswers} className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                            {questions.question1}
                                        </label>
                                        <Input
                                            value={answer1}
                                            onChange={(e) => setAnswer1(e.target.value)}
                                            placeholder="Escriba su respuesta"
                                            className="h-11 border-slate-200 bg-white rounded-xl text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                            {questions.question2}
                                        </label>
                                        <Input
                                            value={answer2}
                                            onChange={(e) => setAnswer2(e.target.value)}
                                            placeholder="Escriba su respuesta"
                                            className="h-11 border-slate-200 bg-white rounded-xl text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep(1)} disabled={isLoading}>
                                        Atrás
                                    </Button>
                                    <Button type="submit" className="flex-[2] h-12 font-bold rounded-xl" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Verificar y Recuperar
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-5 animate-in fade-in zoom-in duration-500">
                                <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                                </div>

                                {recoveryType === 'username' && (
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-800">Usuario Recuperado</h3>
                                        <p className="text-slate-500 text-xs">Su nombre de usuario para iniciar sesión es:</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 font-mono font-black text-primary text-lg select-all">
                                            {recoveredUsername}
                                        </div>
                                    </div>
                                )}

                                {recoveryType === 'email' && (
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-slate-800">Correo Recuperado</h3>
                                        <p className="text-slate-500 text-xs">Su correo electrónico registrado es:</p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 font-mono font-black text-primary text-base select-all">
                                            {recoveredEmail}
                                        </div>
                                    </div>
                                )}

                                <Button asChild className="w-full h-12 rounded-xl">
                                    <Link to="/login">Ir al Inicio de Sesión</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Informational */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-primary shrink-0">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/medical_login.png"
                        alt="Medical Illustration"
                        className="w-full h-full object-cover opacity-50 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-transparent" />
                </div>

                <div className="relative z-10 w-full flex flex-col p-12 lg:p-16 justify-between h-full animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-widest uppercase">
                            <Activity className="h-3.5 w-3.5 text-emerald-400" />
                            Seguridad Institucional
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Recuperación <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Auto-gestionada</span>
                        </h2>
                        <p className="text-lg lg:text-xl text-white/70 max-w-md leading-relaxed font-light">
                            Recupere sus credenciales de manera rápida y segura utilizando sus respuestas de seguridad personalizadas.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-8">
                        {[
                            { icon: HeartPulse, label: 'Precisión Clínica', desc: 'Diagnósticos asistidos' },
                            { icon: ShieldCheck, label: 'Seguridad Total', desc: 'Datos encriptados' }
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 space-y-2.5 hover:bg-white/20 transition-all duration-300">
                                <div className="p-2 rounded-xl bg-white/20 w-fit">
                                    <item.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-bold">{item.label}</h4>
                                    <p className="text-white/50 text-[10px] italic">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
