-- 食堂管理資料庫遷移腳本 (SQL Server 2016)

-- 租戶（餐廳/工廠）
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tenants' AND xtype='U')
CREATE TABLE tenants (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 使用者
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id),
    username NVARCHAR(50) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user',
    can_view_dashboard BIT NOT NULL CONSTRAINT DF_users_can_view_dashboard DEFAULT 0,
    can_manage_purchases BIT NOT NULL CONSTRAINT DF_users_can_manage_purchases DEFAULT 0,
    can_manage_items BIT NOT NULL CONSTRAINT DF_users_can_manage_items DEFAULT 0,
    can_view_reports BIT NOT NULL CONSTRAINT DF_users_can_view_reports DEFAULT 0,
    can_manage_tenants BIT NOT NULL CONSTRAINT DF_users_can_manage_tenants DEFAULT 0,
    can_manage_users BIT NOT NULL CONSTRAINT DF_users_can_manage_users DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Preserve existing accounts' current business-module access when upgrading older databases.
-- New accounts default to no module permissions until explicitly granted.
IF COL_LENGTH('users', 'can_view_dashboard') IS NULL
BEGIN
    ALTER TABLE users ADD can_view_dashboard BIT NOT NULL CONSTRAINT DF_users_can_view_dashboard DEFAULT 1 WITH VALUES;
    ALTER TABLE users DROP CONSTRAINT DF_users_can_view_dashboard;
    ALTER TABLE users ADD CONSTRAINT DF_users_can_view_dashboard DEFAULT 0 FOR can_view_dashboard;
END;
IF COL_LENGTH('users', 'can_manage_purchases') IS NULL
BEGIN
    ALTER TABLE users ADD can_manage_purchases BIT NOT NULL CONSTRAINT DF_users_can_manage_purchases DEFAULT 1 WITH VALUES;
    ALTER TABLE users DROP CONSTRAINT DF_users_can_manage_purchases;
    ALTER TABLE users ADD CONSTRAINT DF_users_can_manage_purchases DEFAULT 0 FOR can_manage_purchases;
END;
IF COL_LENGTH('users', 'can_manage_items') IS NULL
BEGIN
    ALTER TABLE users ADD can_manage_items BIT NOT NULL CONSTRAINT DF_users_can_manage_items DEFAULT 1 WITH VALUES;
    ALTER TABLE users DROP CONSTRAINT DF_users_can_manage_items;
    ALTER TABLE users ADD CONSTRAINT DF_users_can_manage_items DEFAULT 0 FOR can_manage_items;
END;
IF COL_LENGTH('users', 'can_view_reports') IS NULL
BEGIN
    ALTER TABLE users ADD can_view_reports BIT NOT NULL CONSTRAINT DF_users_can_view_reports DEFAULT 1 WITH VALUES;
    ALTER TABLE users DROP CONSTRAINT DF_users_can_view_reports;
    ALTER TABLE users ADD CONSTRAINT DF_users_can_view_reports DEFAULT 0 FOR can_view_reports;
END;
IF COL_LENGTH('users', 'can_manage_tenants') IS NULL
BEGIN
    ALTER TABLE users ADD can_manage_tenants BIT NOT NULL CONSTRAINT DF_users_can_manage_tenants DEFAULT 1 WITH VALUES;
    ALTER TABLE users DROP CONSTRAINT DF_users_can_manage_tenants;
    ALTER TABLE users ADD CONSTRAINT DF_users_can_manage_tenants DEFAULT 0 FOR can_manage_tenants;
END;
IF COL_LENGTH('users', 'can_manage_users') IS NULL
    ALTER TABLE users ADD can_manage_users BIT NOT NULL CONSTRAINT DF_users_can_manage_users DEFAULT 0 WITH VALUES;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_users_username' AND object_id = OBJECT_ID('users'))
    CREATE UNIQUE INDEX IX_users_username ON users(username);

-- 品項分類
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id),
    name_zh NVARCHAR(50) NOT NULL,
    name_en NVARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0
);

-- 品項
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='items' AND xtype='U')
CREATE TABLE items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id),
    category_id INT REFERENCES categories(id),
    name_zh NVARCHAR(100) NOT NULL,
    name_en NVARCHAR(100) NOT NULL,
    unit NVARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 採購記錄
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='purchases' AND xtype='U')
CREATE TABLE purchases (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id),
    item_id INT NOT NULL REFERENCES items(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price AS (quantity * unit_price),
    purchase_date DATE NOT NULL,
    note NVARCHAR(500),
    created_by INT REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 庫存
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inventory' AND xtype='U')
CREATE TABLE inventory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id),
    item_id INT NOT NULL REFERENCES items(id),
    quantity DECIMAL(10,2) DEFAULT 0,
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Run this schema before creating the initial administrator with:
-- npm --prefix server run bootstrap-admin

-- 預設分類
IF NOT EXISTS (SELECT * FROM tenants WHERE name = N'預設餐廳')
    INSERT INTO tenants (name) VALUES (N'預設餐廳');

DECLARE @defaultTenantId INT;
SELECT TOP (1) @defaultTenantId = id
FROM tenants
WHERE name = N'預設餐廳'
ORDER BY id;

IF NOT EXISTS (SELECT * FROM categories WHERE tenant_id = @defaultTenantId)
BEGIN
    INSERT INTO categories (tenant_id, name_zh, name_en, sort_order) VALUES
    (@defaultTenantId, N'米麵類', 'Rice & Noodles', 1),
    (@defaultTenantId, N'油類', 'Oil', 2),
    (@defaultTenantId, N'調味料', 'Seasonings', 3),
    (@defaultTenantId, N'醬汁', 'Sauces', 4),
    (@defaultTenantId, N'醋類', 'Vinegar', 5),
    (@defaultTenantId, N'雜貨', 'Groceries', 6),
    (@defaultTenantId, N'飲料', 'Beverages', 7),
    (@defaultTenantId, N'清潔用品', 'Cleaning Supplies', 8);
END

-- 預設品項
IF NOT EXISTS (SELECT * FROM items WHERE tenant_id = @defaultTenantId)
BEGIN
    INSERT INTO items (tenant_id, category_id, name_zh, name_en, unit)
    SELECT @defaultTenantId, c.id, seed.name_zh, seed.name_en, seed.unit
    FROM (VALUES
        (N'米麵類', N'白米', N'White Rice', N'公斤'),
        (N'米麵類', N'麵條', N'Noodles', N'包'),
        (N'米麵類', N'麵粉', N'Flour', N'公斤'),
        (N'油類', N'沙拉油', N'Cooking Oil', N'瓶'),
        (N'油類', N'麻油', N'Sesame Oil', N'瓶'),
        (N'調味料', N'鹽', N'Salt', N'包'),
        (N'調味料', N'糖', N'Sugar', N'公斤'),
        (N'調味料', N'味精', N'MSG', N'包'),
        (N'調味料', N'胡椒', N'Pepper', N'包'),
        (N'醬汁', N'醬油', N'Soy Sauce', N'瓶'),
        (N'醬汁', N'蠔油', N'Oyster Sauce', N'瓶'),
        (N'醬汁', N'番茄醬', N'Ketchup', N'瓶'),
        (N'醋類', N'白醋', N'White Vinegar', N'瓶'),
        (N'醋類', N'烏醋', N'Black Vinegar', N'瓶'),
        (N'雜貨', N'雞蛋', N'Eggs', N'箱'),
        (N'雜貨', N'豆腐', N'Tofu', N'盒'),
        (N'飲料', N'茶包', N'Tea Bags', N'盒'),
        (N'飲料', N'咖啡', N'Coffee', N'罐'),
        (N'清潔用品', N'洗碗精', N'Dish Soap', N'瓶'),
        (N'清潔用品', N'垃圾袋', N'Trash Bags', N'捲')
    ) AS seed(category_name_zh, name_zh, name_en, unit)
    INNER JOIN categories c
        ON c.tenant_id = @defaultTenantId
        AND c.name_zh = seed.category_name_zh;
END
