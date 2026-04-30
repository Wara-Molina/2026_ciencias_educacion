'use client'

import { Award, Users, Target, Heart } from 'lucide-react'

const team = [
  {
    name: "Dra. Carmen Rodríguez",
    role: "Directora General",
    bio: "20 años de experiencia en educación superior y desarrollo curricular"
  },
  {
    name: "Prof. Miguel Ángel Suárez",
    role: "Coordinador Académico",
    bio: "Especialista en metodologías educativas innovadoras"
  },
  {
    name: "Dra. Beatriz López",
    role: "Directora de Investigación",
    bio: "Experta en pedagogía experimental y nuevas tendencias educativas"
  },
  {
    name: "Ing. Francisco García",
    role: "Director de Tecnología",
    bio: "Líder en transformación digital del sector educativo"
  },
]

export default function About() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-secondary/10 to-background py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Acerca de EducaHub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Somos una institución comprometida con la transformación de la educación a través de programas de excelencia académica y profesores dedicados.
            </p>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Nuestra Historia</h2>
              <p className="text-muted-foreground mb-4">
                Fundada en 1995, EducaHub ha sido pionera en la educación en Ciencias de la Educación. Lo que comenzó como un pequeño departamento académico se ha convertido en una institución reconocida a nivel nacional e internacional.
              </p>
              <p className="text-muted-foreground mb-4">
                Con más de 30 años de trayectoria, hemos formado a miles de educadores, investigadores y líderes en el campo de la educación. Nuestro compromiso con la excelencia y la innovación nos mantiene a la vanguardia del cambio educativo.
              </p>
              <p className="text-muted-foreground">
                Hoy en día, continuamos transformando vidas a través de la educación de calidad y el apoyo integral a nuestros estudiantes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-bold text-primary mb-2">30+</div>
                <p className="text-sm text-muted-foreground">Años de trayectoria</p>
              </div>
              <div className="p-8 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-bold text-accent mb-2">10K+</div>
                <p className="text-sm text-muted-foreground">Egresados exitosos</p>
              </div>
              <div className="p-8 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-bold text-secondary mb-2">50+</div>
                <p className="text-sm text-muted-foreground">Programas activos</p>
              </div>
              <div className="p-8 bg-card rounded-xl border border-border text-center">
                <div className="text-4xl font-bold text-primary mb-2">5</div>
                <p className="text-sm text-muted-foreground">Reconocimientos internacionales</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestros Valores</h2>
            <p className="text-lg text-muted-foreground">Lo que nos define como institución educativa</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-8 bg-card rounded-xl border border-border text-center hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/10 rounded-lg inline-block mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Excelencia</h3>
              <p className="text-sm text-muted-foreground">
                Buscamos la máxima calidad en todos nuestros programas y servicios educativos.
              </p>
            </div>

            <div className="p-8 bg-card rounded-xl border border-border text-center hover:shadow-lg transition-shadow">
              <div className="p-4 bg-accent/10 rounded-lg inline-block mb-4">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Innovación</h3>
              <p className="text-sm text-muted-foreground">
                Nos mantenemos en la vanguardia de las nuevas metodologías y tecnologías educativas.
              </p>
            </div>

            <div className="p-8 bg-card rounded-xl border border-border text-center hover:shadow-lg transition-shadow">
              <div className="p-4 bg-secondary/10 rounded-lg inline-block mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Inclusión</h3>
              <p className="text-sm text-muted-foreground">
                Nos comprometemos a crear espacios accesibles y equitativos para todos.
              </p>
            </div>

            <div className="p-8 bg-card rounded-xl border border-border text-center hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/10 rounded-lg inline-block mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Compromiso</h3>
              <p className="text-sm text-muted-foreground">
                Estamos dedicados al desarrollo integral de nuestros estudiantes y colegas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestro Equipo de Liderazgo</h2>
            <p className="text-lg text-muted-foreground">Profesionales con amplia experiencia en educación</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-shadow text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm font-semibold text-primary mb-3">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Preguntas o Sugerencias?</h2>
          <p className="text-lg opacity-90 mb-8">
            Nos encantaría escuchar de ti. Comunícate con nosotros para cualquier consulta.
          </p>
          <div className="space-y-3">
            <p className="text-lg">
              📧 Email: <a href="mailto:info@educahub.edu" className="hover:underline">info@educahub.edu</a>
            </p>
            <p className="text-lg">
              📞 Teléfono: <a href="tel:+34911234567" className="hover:underline">+34 91 123 45 67</a>
            </p>
            <p className="text-lg">
              📍 Ubicación: Calle de la Educación 123, 28001 Madrid, España
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
