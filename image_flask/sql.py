import pymysql
import hashlib
import pymysql

# 3、Mysql
connection = pymysql.connect(host='10.12.13.61',port=3306, user='root',password='305099ghj', database='zjw')

def sha_256(data: str):
    # 使用 SHA-256 算法进行加密
    sha256_hash = hashlib.sha256()
    sha256_hash.update(data.encode())
    sha256_digest = sha256_hash.hexdigest()
    return sha256_digest

def get_userInfo_by_username(username: str):
    with connection.cursor() as cursor:
        # 执行查询用户信息的 SQL 查询
        sql_query = "SELECT * FROM users WHERE username = %s"
        cursor.execute(sql_query, (username))
        result = cursor.fetchone()
        return {
            'email': result[1],
            'username': result[2],
            'avatarUrl': result[6],
            'state': 'online'
        }

def user_login_auth(user_login_data: dict):
    with connection.cursor() as cursor:
        # 执行查询用户信息的 SQL 查询
        sql_query = "SELECT * FROM users WHERE username = %s"
        cursor.execute(sql_query, (user_login_data['username']))
        result = cursor.fetchone()
        # 匹配密码
        if result and sha_256(user_login_data['password']) == result[3]:
            return {
                'email': result[1],
                'username': result[2],
                'avatarUrl': result[6],
                'state': 'online'
            }
        else:
            return None

def add_new_user_to_mysql(user_data: dict):
    with connection.cursor() as cursor:
        # 插入新用户数据的 SQL 查询语句
        insert_user_query = """
        INSERT INTO users (username, email, password, permission) VALUES (%s, %s, %s, %s)
        """
        # 执行插入新用户数据的 SQL 查询
        cursor.execute(insert_user_query, (user_data['username'],
                                           user_data['email'],
                                           sha_256(user_data['password1']),
                                           '1'))
    # 提交事务
    connection.commit()



connection = pymysql.connect(host='10.12.13.61',port=3306, user='root',password='305099ghj', database='zjw')


# #files表
# with connection.cursor() as cursor:
#     # 创建表格的 SQL 查询语句
#     create_table_query = """
#         CREATE TABLE IF NOT EXISTS files (
#             id INT AUTO_INCREMENT PRIMARY KEY,
#             type INT NOT NULL,
#             image_url VARCHAR(1000),
#             image_width INT,
#             image_height INT,
#             upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
#             user_id INT,
#             FOREIGN KEY (user_id) REFERENCES users(id)
#         )
#         """

#     # 执行创建表格的 SQL 查询
#     cursor.execute(create_table_query)

#     # 提交事务
#     connection.commit()

    
# # products表
# with connection.cursor() as cursor:
#     # 创建表格的 SQL 查询语句
#     create_table_query = """
#         CREATE TABLE IF NOT EXISTS products (
#             id INT AUTO_INCREMENT PRIMARY KEY,
#             type INT NOT NULL,
#             from_text VARCHAR(1000),
#             from_image VARCHAR(1000),
#             image_url VARCHAR(1000),
#             image_width INT,
#             image_height INT,
#             generate_time DATETIME DEFAULT CURRENT_TIMESTAMP,
#             user_id INT,
#             FOREIGN KEY (user_id) REFERENCES users(id)
#         )
#         """

#     # 执行创建表格的 SQL 查询
#     cursor.execute(create_table_query)

#     # 提交事务
#     connection.commit()


# # users表
# with connection.cursor() as cursor:
#     # 创建表格的 SQL 查询语句
#     create_table_query = """
#     CREATE TABLE IF NOT EXISTS users (
#         id INT AUTO_INCREMENT PRIMARY KEY,
#         email VARCHAR(500) UNIQUE NOT NULL,
#         username VARCHAR(500) UNIQUE NOT NULL,
#         password VARCHAR(500) NOT NULL,
#         permission INT NOT NULL,
#         phone VARCHAR(20),
#         avatar VARCHAR(1000)
#     )
#     """

#     # 执行创建表格的 SQL 查询
#     cursor.execute(create_table_query)

#     # 提交事务
#     connection.commit()