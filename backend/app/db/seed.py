from sqlmodel import select

from app.core.config import settings
from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

CATEGORIAS = [("Hamburguesas", "Hamburguesas del día"), ("Pizzas", "Pizzas artesanales"), ("Bebidas", "Bebidas frías")]
PRODUCTOS = [("Hamburguesa clásica", "Hamburguesas", 8500.0), ("Pizza muzzarella", "Pizzas", 11000.0), ("Agua mineral", "Bebidas", 2500.0)]


def run():
    create_all_tables()
    with session_factory() as session:
        admin = session.exec(select(Usuario).where(Usuario.username == settings.seed_admin_username)).first()
        if admin is None:
            session.add(Usuario(username=settings.seed_admin_username, full_name="Administrador Food Store",
                                email=settings.seed_admin_email, hashed_password=hash_password(settings.seed_admin_password), role="admin"))
        categorias = {}
        for nombre, descripcion in CATEGORIAS:
            categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(categoria)
                session.flush()
            categorias[nombre] = categoria.id
        for nombre, categoria, precio in PRODUCTOS:
            if session.exec(select(Producto).where(Producto.nombre == nombre)).first() is None:
                session.add(Producto(nombre=nombre, categoria_id=categorias[categoria], precio_base=precio,
                                     stock=20, descripcion="Preparado para tu pedido"))
        session.commit()
    print("Seed completado: admin, categorías y productos")


if __name__ == "__main__":
    run()
