package com.nexus.identify_access;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class IdentifyAccessApplication {

	public static void main(String[] args) {
		// Tự động tìm file .env duy nhất từ thư mục hiện tại lùi dần lên thư mục gốc
		java.io.File dir = new java.io.File(".").getAbsoluteFile();
		while (dir != null) {
			java.io.File envFile = new java.io.File(dir, ".env");
			if (envFile.exists() && envFile.isFile()) {
				Dotenv dotenv = Dotenv.configure().directory(dir.getAbsolutePath()).load();
				dotenv.entries().forEach(entry -> {
					if (System.getProperty(entry.getKey()) == null) {
						System.setProperty(entry.getKey(), entry.getValue());
					}
				});
				break;
			}
			dir = dir.getParentFile();
		}

		SpringApplication.run(IdentifyAccessApplication.class, args);
	}

}
