import { parse } from 'csv-parse';
import fs from 'fs';

import { ICategoriesRepository } from '../../repositories/ICategoriesRepository';

interface IImportCategories {
  name: string;
  description: string;
}

export class ImportCategoriesUseCase {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  loadCategories(file: Express.Multer.File): Promise<IImportCategories[]> {
    return new Promise((resolve, reject) => {
      const categories: IImportCategories[] = [];

      const stream = fs.createReadStream(file.path);

      const parseFile = parse();

      stream.pipe(parseFile);

      parseFile
        .on('data', async ([name, description]: string[]) => {
          categories.push({
            name,
            description,
          });
        })
        .on('end', () => {
          fs.promises.unlink(file.path);
          resolve(categories);
        })
        .on('error', err => {
          reject(err);
        });
    });
  }

  async execute(file: Express.Multer.File): Promise<void> {
    const categories = await this.loadCategories(file);

    categories.map(async ({ name, description }) => {
      const categoryAlreadyExists = this.categoriesRepository.findByName(name);

      if (!categoryAlreadyExists) {
        this.categoriesRepository.create({
          name,
          description,
        });
      }
    });
  }
}
