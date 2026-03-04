using System;

namespace RaizesStore.Domain.Entities;

public abstract class Entity
{
    protected Entity()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
    }

    protected Entity(Guid id)
    {
        Id = id;
    }

    public Guid Id { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }
    public DateTimeOffset UpdatedAt { get; protected set; }
    public DateTimeOffset? DeletedAt { get; protected set; }

    public override bool Equals(object? obj)
    {
        var compareTo = obj as Entity;

        if (ReferenceEquals(this, compareTo)) return true;
        return compareTo is not null && Id.Equals(compareTo.Id);
    }

    public static bool operator ==(Entity? a, Entity? b)
    {
        if (a is null && b is null)
            return true;

        if (a is null || b is null)
            return false;

        return a.Equals(b);
    }

    public static bool operator !=(Entity? a, Entity? b) => !(a == b);

    public override int GetHashCode() => GetType().GetHashCode() * 907 + Id.GetHashCode();

    public override string ToString() => $"{GetType().Name} [Id={Id}]";

    public void SetUpdateAt()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SetCreateAt(DateTimeOffset dt)
    {
        CreatedAt = dt;
    }

    public void Delete()
    {
        DeletedAt = DateTimeOffset.UtcNow;
    }

    public void SetDeleteNull()
    {
        DeletedAt = null;
    }

    public bool Editado => (UpdatedAt - CreatedAt).TotalSeconds > 1;
}
