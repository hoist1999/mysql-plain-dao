// 定义灵活的 InsertModel 类型，接受要忽略的字段名
export type InsertModel<T, K extends keyof T> = Omit<T, K>;

// 更简洁的基础 DAO 类
export abstract class BaseDao<
  T,
  OmitFields extends keyof T = never
> {
  protected tableName: string;
  protected omitFields: OmitFields[];

  constructor(config: {
    tableName: string;
    omitFields: OmitFields[];
  }) {
    this.tableName = config.tableName;
    this.omitFields = config.omitFields;
  }

  // 简化的插入方法，只需要一个类型参数
  async insertAsync(entity: InsertModel<T, OmitFields>): Promise<T> {
    // 构建要插入的字段列表
    const entityObj = entity as Record<string, any>;
    const fields = Object.keys(entityObj);

    // 构建 SQL
    const fieldList = fields.join(', ');
    const valuePlaceholders = fields.map(() => '?').join(', ');
    const values = fields.map(f => entityObj[f]);

    // 数据库操作...

    // 返回结果，包含自动生成的字段
    const result = { ...entity } as any;

    // 添加所有被忽略的字段
    this.omitFields.forEach(field => {
      result[field] = field.toString().includes('id') ? 123 : 'generated-value';
    });

    return result as T;
  }
}

// 使用示例
interface User {
  user_id: number;
  user_uuid: string;
  username: string;
  email: string;
}

class UserDao extends BaseDao<User, 'user_id' | 'user_uuid'> {
  constructor() {
    super({
      tableName: 'users',
      omitFields: ['user_id', 'user_uuid']
    });
  }
}

// 使用
const userDao = new UserDao();
await userDao.insertAsync({
  username: 'johndoe',
  email: 'john@example.com'
});

// 演示不同的 DAO 类型
interface Product {
  product_id: number;
  name: string;
  price: number;
}

class ProductDao extends BaseDao<Product, 'product_id'> {
  constructor() {
    super({
      tableName: 'products',
      omitFields: ['product_id']
    });
  }
}

const productDemo = async () => {
  const productDao = new ProductDao();

  // 创建产品时不需要提供 product_id
  const product = await productDao.insertAsync({
    name: 'Smartphone',
    price: 999
  });

  console.log('Inserted product:', product);
};

// 运行演示
productDemo();