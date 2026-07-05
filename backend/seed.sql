INSERT INTO companies (name, description, website, industry_focus)
VALUES (
  'TechForge Solutions',
  'TechForge Solutions is a premium IT consulting and digital transformation firm. We help mid-to-large enterprises modernize legacy systems, adopt cloud-native architectures, implement AI-driven automation, and strengthen cybersecurity postures. Our team of 200+ engineers has delivered 500+ successful engagements across 15 countries.',
  'https://techforgesolutions.com',
  'Technology Consulting'
);

INSERT INTO services (company_id, name, description) VALUES
(1, 'Cloud Migration & Infrastructure', 'End-to-end migration of on-premise infrastructure to AWS, Azure, and GCP. Includes lift-and-shift, re-architecting, and hybrid cloud setups with 99.99% uptime SLAs.'),
(1, 'AI/ML Integration', 'Custom AI model development and integration for predictive analytics, natural language processing, computer vision, and intelligent process automation.'),
(1, 'Cybersecurity Assessment & Implementation', 'Comprehensive security audits, penetration testing, SOC 2 compliance, zero-trust architecture implementation, and 24/7 threat monitoring.'),
(1, 'Legacy System Modernization', 'Refactoring and replatforming legacy monolithic applications into modern microservices architectures with containerization and orchestration.'),
(1, 'Data Engineering & Analytics', 'Building scalable data pipelines, data warehouses, real-time analytics dashboards, and business intelligence solutions using modern data stacks.');

INSERT INTO case_studies (company_id, title, client_name, challenge, solution, results) VALUES
(1, 'Reducing Cloud Costs by 40% for FinServe Global', 'FinServe Global', 'FinServe was spending $2.5M annually on cloud infrastructure with 35% wastage due to over-provisioned resources and lack of auto-scaling.', 'We implemented AWS Auto Scaling, reserved instance optimization, and built a custom cost-monitoring dashboard. Migrated 60% of workloads to spot instances.', 'Reduced cloud spend by 40% ($1M annual savings). Improved deployment frequency by 3x. Achieved 99.99% uptime.'),
(1, 'AI-Powered Customer Support for RetailMax', 'RetailMax Inc.', 'RetailMax received 50,000+ support tickets monthly with 70% being repetitive queries. Average response time was 48 hours.', 'Deployed a custom NLP chatbot using GPT-based models integrated with their existing CRM. Automated responses for 80% of ticket categories.', 'Response time reduced to 2 minutes. Customer satisfaction scores increased by 35%. Support team costs reduced by 60%.'),
(1, 'Zero-Trust Security Overhaul for HealthData Corp', 'HealthData Corp', 'HealthData needed to achieve HIPAA compliance and protect patient data across 12 distributed offices with legacy VPN infrastructure.', 'Designed and deployed a zero-trust architecture with Okta SSO, beyondcorp-style access, endpoint detection, and 24/7 SOC monitoring.', 'Achieved HIPAA compliance in 4 months. Zero security incidents in 18 months. 40% reduction in IT helpdesk tickets.');

INSERT INTO pricing_plans (company_id, plan_name, price, features) VALUES
(1, 'Starter', 15000.00, ARRAY['Initial consultation & audit', 'Project roadmap', 'Basic cloud migration', 'Email support', 'Quarterly review']),
(1, 'Growth', 45000.00, ARRAY['Everything in Starter', 'Full cloud migration', 'AI/ML integration (1 model)', 'Cybersecurity audit', 'Dedicated project manager', 'Weekly updates', 'Priority email & phone support']),
(1, 'Enterprise', 120000.00, ARRAY['Everything in Growth', 'Unlimited AI/ML models', 'Zero-trust security implementation', '24/7 dedicated support team', 'On-site engineering team', 'Monthly strategy sessions', 'SOC 2 compliance assistance', 'Custom SLA']);

INSERT INTO target_industries (company_id, industry_name) VALUES
(1, 'Financial Services & Banking'),
(1, 'Healthcare & Life Sciences'),
(1, 'E-commerce & Retail'),
(1, 'Manufacturing & Logistics'),
(1, 'SaaS & Technology'),
(1, 'Education & EdTech');
