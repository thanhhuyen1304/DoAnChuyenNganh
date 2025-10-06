import React from "react";
import { Card, CardContent } from "./ui/card";
import { Star } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

const Testimonials = () => {
  const { t } = useLanguage();
  const testimonials = [
    {
      name: "Minh Tuấn",
      role: "Senior Developer",
      company: "Tech Corp",
      avatar: "👨‍💼",
      content: "BugHunter đã giúp tôi cải thiện kỹ năng debug đáng kể. Các bài tập thực tế và hệ thống theo dõi tiến độ rất hữu ích.",
      rating: 5,
    },
    {
      name: "Hương Giang",
      role: "Full-stack Developer",
      company: "StartUp XYZ",
      avatar: "👩‍💼",
      content: "Nền tảng tuyệt vời cho người mới bắt đầu. Video hướng dẫn rất chi tiết và dễ hiểu. Tôi đã học được rất nhiều kỹ thuật debug mới.",
      rating: 5,
    },
    {
      name: "Đức Anh",
      role: "Backend Developer",
      company: "Innovation Labs",
      avatar: "🧑‍💼",
      content: "Các thử thách debug thực sự thách thức và giúp tôi sẵn sàng hơn cho công việc. Hệ thống gamification cũng rất thú vị!",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            {t("testimonials.title").split(" ")[0]}{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {t("testimonials.title").split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-accent text-accent animate-scale-in"
                      style={{ animationDelay: `${(index * 0.1) + (i * 0.05)}s` }}
                    />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                    <p className="text-sm text-primary">{testimonial.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
