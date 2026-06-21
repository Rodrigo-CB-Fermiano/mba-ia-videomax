-- CreateTable: categories
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tags
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable: video_categories
CREATE TABLE "video_categories" (
    "video_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "video_categories_pkey" PRIMARY KEY ("video_id","category_id")
);

-- CreateTable: video_tags
CREATE TABLE "video_tags" (
    "video_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "video_tags_pkey" PRIMARY KEY ("video_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- AddForeignKey
ALTER TABLE "video_categories" ADD CONSTRAINT "video_categories_video_id_fkey"
    FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_categories" ADD CONSTRAINT "video_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_video_id_fkey"
    FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed predefined categories
INSERT INTO "categories" ("name", "slug") VALUES
    ('Aula', 'aula'),
    ('Reunião', 'reuniao'),
    ('Tutorial', 'tutorial'),
    ('Webinar', 'webinar'),
    ('Conferência', 'conferencia'),
    ('Treinamento', 'treinamento'),
    ('Entrevista', 'entrevista'),
    ('Apresentação', 'apresentacao'),
    ('Demonstração', 'demonstracao'),
    ('Outro', 'outro');

-- Seed predefined tags
INSERT INTO "tags" ("name", "slug") VALUES
    ('Trabalho', 'trabalho'),
    ('Estudo', 'estudo'),
    ('Projeto', 'projeto'),
    ('Importante', 'importante'),
    ('Revisão', 'revisao'),
    ('Referência', 'referencia'),
    ('Cliente', 'cliente'),
    ('Interno', 'interno'),
    ('Produto', 'produto'),
    ('Pessoal', 'pessoal');
