module.exports = {
  apps: [
    {
      name: 'gamatecha-be', // Nama aplikasi
      script: 'dist/main.js', // Lokasi file hasil build NestJS
      exec_mode: 'fork', // Menjalankan aplikasi dalam mode fork
      instances: 1, // Jumlah instance aplikasi (1 untuk single instance, gunakan 'max' untuk otomatis menyesuaikan jumlah CPU)
      autorestart: true, // Otomatis restart aplikasi jika terjadi crash
      watch: false, // Menonaktifkan watch (pengawasan terhadap perubahan file, set true jika ingin memonitor file)
      max_memory_restart: '1G', // Maksimum penggunaan memori sebelum restart aplikasi
      env: {
        NODE_ENV: 'development', // Environment untuk development
        PORT: 3001, // Port aplikasi berjalan
      },
      env_production: {
        NODE_ENV: 'production', // Environment untuk production
        PORT: 3001, // Port aplikasi berjalan
      },
    },
  ],
};
