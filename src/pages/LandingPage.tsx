import React from 'react'
import { Layout } from '../components/Layout'
import { InteractiveMap } from '../components/InteractiveMap'
import {
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Smartphone,
  Users,
  Gift,
  Camera,
  Heart,
  DollarSign,
  Navigation,
  Compass,
  Lightbulb,
  Coins
} from 'lucide-react'

// Apple-like Section Component
const AppleSection: React.FC<{
  bg?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ bg = 'bg-transparent', className = '', children }) => (
  <section 
    className={`
      py-16 md:py-20 px-4 
      ${bg} 
      ${className}
      relative overflow-hidden
    `}
  >
    <div className="container mx-auto max-w-6xl relative z-10">
      {children}
    </div>
  </section>
);

// Apple-like Gradient Background
const GradientBackground: React.FC = () => (
  <div 
    className="
      absolute 
      inset-0 
      bg-gradient-to-br 
      from-blue-50 
      via-white 
      to-blue-100 
      opacity-50 
      pointer-events-none
    "
  />
);

export const LandingPage: React.FC = () => {
  return (
    <Layout hideNavigation={true} className="bg-white">
      <div className="space-y-16">
        {/* Hero Section - Apple-like Clean Design */}
        <AppleSection 
          bg="bg-white" 
          className="min-h-screen flex items-center justify-center text-center"
        >
          <GradientBackground />
          <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
            <h1 
              className="
                text-5xl md:text-6xl lg:text-7xl 
                font-bold 
                text-transparent 
                bg-clip-text 
                bg-gradient-to-br 
                from-blue-600 
                to-blue-400 
                mb-6
                tracking-tight
              "
            >
              Descubra. <br/> Compartilhe. <br/> <span className="font-extrabold">Ganhe.</span>
            </h1>
            <p 
              className="
                text-xl 
                text-gray-700 
                max-w-3xl 
                mx-auto 
                mb-10 
                leading-relaxed
              "
            >
              Transforme seu amor pela cidade em uma jornada de descobertas e recompensas com VemSimbora GO.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/login"
                className="
                  px-8 py-3 
                  bg-blue-600 
                  text-white 
                  rounded-full 
                  shadow-xl 
                  hover:bg-blue-700 
                  transition 
                  transform 
                  hover:-translate-y-1
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-blue-500 
                  focus:ring-opacity-50
                "
              >
                Começar Agora
              </a>
              <button // Changed to button
                className="
                  px-8 py-3 
                  border 
                  border-gray-300 
                  text-gray-700 
                  rounded-full 
                  hover:bg-gray-50 
                  transition
                "
              >
                Saiba Mais
              </button>
            </div>
          </div>
        </AppleSection>

        {/* Interactive Map Section */}
        <AppleSection bg="bg-gray-50">
          <div className="text-center mb-12">
            <h2 
              className="
                text-4xl 
                font-bold 
                text-gray-900 
                mb-4 
                tracking-tight
              "
            >
              Explore Aracaju
            </h2>
            <p 
              className="
                text-xl 
                text-gray-600 
                max-w-2xl 
                mx-auto
              "
            >
              Descubra missões únicas e compartilhe suas experiências na cidade.
            </p>
          </div>
          <div 
            className="
              bg-white 
              rounded-2xl 
              shadow-2xl 
              overflow-hidden 
              border 
              border-gray-200
              animate-fade-in
            "
          >
            <InteractiveMap />
          </div>
        </AppleSection>

        {/* Features Grid - Apple Card-like Design */}
        <AppleSection>
          <div className="text-center mb-16">
            <h2 
              className="
                text-4xl 
                font-bold 
                text-gray-900 
                tracking-tight
              "
            >
                Como Funciona
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto">
              Transforme sua paixão por explorar em recompensas reais. Veja como é fácil começar:
            </p>
          </div>
          <div 
            className="
              grid 
              grid-cols-1 
              md:grid-cols-3 
              gap-8
            "
          >
            {[
              {
                icon: Compass,
                title: 'Explore',
                description: 'Encontre missões exclusivas perto de você, desde pontos turísticos famosos até joias escondidas.',
                color: 'text-blue-600'
              },
              {
                icon: Lightbulb,
                title: 'Crie',
                description: 'Compartilhe suas experiências e talentos através de fotos, vídeos e histórias cativantes.',
                color: 'text-green-600'
              },
              {
                icon: Coins,
                title: 'Ganhe',
                description: 'Seja recompensado por suas descobertas e contribuições, transformando sua paixão em renda extra.',
                color: 'text-purple-600'
              }
            ].map(({ icon: Icon, title, description, color }, index) => (
              <div 
                key={index}
                className="
                  bg-white 
                  border 
                  border-gray-200 
                  rounded-2xl 
                  p-8 
                  text-center 
                  shadow-lg 
                  hover:shadow-xl 
                  transition-all 
                  transform 
                  hover:-translate-y-2
                  animate-fade-in
                "
              >
                <div 
                  className={`
                    mx-auto 
                    mb-6 
                    w-20 
                    h-20 
                    flex 
                    items-center 
                    justify-center 
                    ${color} 
                    bg-opacity-10 
                    rounded-full
                  `}
                >
                  <Icon className="w-10 h-10" strokeWidth={1.5} />
                </div>
                <h3 
                  className="
                    text-2xl 
                    font-semibold 
                    text-gray-900 
                    mb-4
                  "
                >
                  {title}
                </h3>
                <p className="text-gray-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </AppleSection>

        {/* Call to Action */}
        <AppleSection 
          bg="bg-gradient-to-br from-blue-600 to-blue-400" 
          className="text-center text-white"
        >
          <div className="max-w-3xl mx-auto">
            <h2 
              className="
                text-4xl 
                md:text-5xl 
                font-bold 
                mb-6 
                text-white
                tracking-tight
              "
            >
              Sua Cidade, Suas Histórias, Suas Recompensas
            </h2>
            <p 
              className="
                text-xl 
                text-white 
                text-opacity-80 
                mb-10
              "
            >
              Transforme cada esquina em uma oportunidade. Com VemSimbora GO, você não apenas explora, mas também contribui para a narrativa da sua cidade e ganha por isso.
            </p>
            <a
              href="/login"
              className="
                px-10 
                py-4 
                bg-white 
                text-blue-600 
                rounded-full 
                text-lg 
                font-semibold 
                shadow-xl 
                hover:bg-gray-100 
                transition 
                transform 
                hover:-translate-y-1
              "
            >
              Comece Sua Jornada
            </a>
          </div>
        </AppleSection>

        {/* Footer */}
        <footer 
          className="
            py-8 
            bg-gray-50 
            text-center 
            border-t 
            border-gray-200
          "
        >
          <p className="text-gray-500">
            © {new Date().getFullYear()} VemSimbora GO. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </Layout>
  )
}