from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
def read_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve categories. Accessible by any logged-in active user.
    """
    categories = db.query(Category).offset(skip).limit(limit).all()
    return categories


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Create a new category. (Admin Only)
    """
    existing_category = db.query(Category).filter(Category.name.ilike(category_in.name)).first()
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail=f"Category with name '{category_in.name}' already exists."
        )
    db_category = Category(
        name=category_in.name,
        description=category_in.description
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Update a category. (Admin Only)
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    if category_in.name:
        existing_category = db.query(Category).filter(
            Category.name.ilike(category_in.name),
            Category.id != category_id
        ).first()
        if existing_category:
            raise HTTPException(
                status_code=400,
                detail=f"Category with name '{category_in.name}' already exists."
            )
        category.name = category_in.name
        
    if category_in.description is not None:
        category.description = category_in.description
        
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", response_model=CategoryResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """
    Delete a category. (Admin Only)
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return category
