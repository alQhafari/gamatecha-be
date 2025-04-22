import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors();

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Gamatecha API')
    .setDescription(
      'API Gamatecha adalah portal yang menyediakan antarmuka untuk mengelola dan mengakses data HUMAS, mencakup fitur autentikasi, pengelolaan pengguna, wilayah, berita, pengumuman, serta integrasi dengan sumber data eksternal seperti postingan Instagram yang di-scrape menjadi artikel.\n\n' +
        '## Fitur Utama\n' +
        '- **Autentikasi dan Otorisasi**: Mendukung autentikasi menggunakan Bearer Token untuk memastikan hanya pengguna terotorisasi yang dapat mengakses endpoint tertentu.\n' +
        '- **Pengelolaan Pengguna**: Menyediakan endpoint untuk pembuatan, pembaruan, penghapusan, dan pengaturan hak akses pengguna.\n' +
        '- **Pengelolaan Wilayah**: Menyediakan endpoint untuk menambah, memperbarui, dan mengakses data wilayah yang terbuka untuk publik.\n' +
        '- **Pengelolaan Berita dan Pengumuman**: Menyediakan endpoint untuk menambah, memperbarui, dan mengakses berita serta pengumuman yang dapat diakses publik.\n' +
        '- **Manajemen Artikel**: Memungkinkan pengelolaan artikel hasil scraping dari postingan Instagram untuk otomatisasi konten blog.\n' +
        '- **Versi API**: Mendukung URI versi untuk memudahkan pengelolaan perubahan tanpa mengganggu aplikasi yang terintegrasi.\n\n' +
        'API ini dirancang untuk mendukung akses data HUMAS secara terstruktur, aman, dan mudah diintegrasikan dengan aplikasi pihak ketiga atau aplikasi internal lainnya, sehingga menjadi platform yang andal untuk sistem komunikasi HUMAS yang terpadu dan responsif.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('iqro', app, document, {
    useGlobalPrefix: true,
    customSiteTitle: 'Gamatecha API',
    swaggerOptions: {
      tagsSorter: 'alpha',
    },
  });

  await app.listen(3001);
}
bootstrap();
