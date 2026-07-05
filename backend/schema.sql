DROP TABLE IF EXISTS generated_emails CASCADE;
DROP TABLE IF EXISTS email_batches CASCADE;
DROP TABLE IF EXISTS target_industries CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS case_studies CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(500),
  industry_focus VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE case_studies (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  client_name VARCHAR(255),
  challenge TEXT,
  solution TEXT,
  results TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pricing_plans (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  plan_name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2),
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE target_industries (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  industry_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_batches (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  target_industry_id INTEGER REFERENCES target_industries(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_requested INTEGER DEFAULT 0,
  total_generated INTEGER DEFAULT 0,
  progress_pct INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_emails (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES email_batches(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255),
  recipient_title VARCHAR(255),
  recipient_company VARCHAR(255),
  subject_line TEXT NOT NULL,
  opening_hook TEXT,
  cta_type VARCHAR(100),
  cta_text TEXT,
  email_body TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_company ON services(company_id);
CREATE INDEX idx_casestudies_company ON case_studies(company_id);
CREATE INDEX idx_pricing_company ON pricing_plans(company_id);
CREATE INDEX idx_industries_company ON target_industries(company_id);
CREATE INDEX idx_batches_company ON email_batches(company_id);
CREATE INDEX idx_emails_batch ON generated_emails(batch_id);
