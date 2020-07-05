import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findById(id: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne(id);
    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsInfo = await this.ormRepository.find({
      id: In(products.map(p => p.id)),
    });

    if (products.length !== productsInfo.length) {
      throw new AppError('Product(s) not found');
    }

    return productsInfo;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updatedItems = await Promise.all(
      products.map(async ({ id, quantity }) => {
        const productToUpdate = await this.ormRepository.findOne(id);

        if (productToUpdate) {
          productToUpdate.quantity = quantity;
          await this.ormRepository.save(productToUpdate);
        } else {
          throw new AppError('Missing Product');
        }

        return productToUpdate;
      }),
    );

    return updatedItems;
  }
}

export default ProductsRepository;
